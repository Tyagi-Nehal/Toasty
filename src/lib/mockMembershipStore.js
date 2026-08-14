// Real Treasurer-controlled membership renewals (supabase/schema.sql:
// member_renewals — seeded blank for the real roster, see
// supabase/seed-member-renewals.sql). Replaces the old fully-fabricated
// mockRenewals.js + self-service UTR flow. Layered on top of the real
// roster (mockRosterStore.js's `members` table) rather than a second,
// disconnected member list.
//
// Active/inactive is derived, not stored: a member is active only if
// membership_end is set and is today or later.

import { supabase } from './supabaseClient.js'
import { getAccount } from './mockAuth.js'
import { getMembers } from './mockRosterStore.js'

const LOG_KEY = 'toasty_renewal_log'
const MAX_LOG_ENTRIES = 25

function logAction(message) {
  const entry = { id: crypto.randomUUID(), message, time: new Date().toISOString() }
  try {
    const raw = localStorage.getItem(LOG_KEY)
    const existing = raw ? JSON.parse(raw) : []
    localStorage.setItem(
      LOG_KEY,
      JSON.stringify([entry, ...existing].slice(0, MAX_LOG_ENTRIES)),
    )
  } catch {
    localStorage.setItem(LOG_KEY, JSON.stringify([entry]))
  }
}

export function getRenewalLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function isActive(membershipEnd) {
  return Boolean(membershipEnd) && membershipEnd >= todayISO()
}

const DEFAULT_STATUS = {
  paymentStatus: 'pending',
  membershipStart: null,
  membershipEnd: null,
  cycleLabel: null,
}

function toStatus(row) {
  if (!row) return { ...DEFAULT_STATUS, isActive: false }
  return {
    paymentStatus: row.payment_status,
    membershipStart: row.membership_start,
    membershipEnd: row.membership_end,
    cycleLabel: row.cycle_label,
    isActive: isActive(row.membership_end),
  }
}

export async function getMemberRenewals() {
  const { data, error } = await supabase.from('member_renewals').select('*')
  if (error) console.error('[mockMembershipStore] getMemberRenewals failed:', error.message)
  return data ?? []
}

// Real roster left-joined with renewal status by name — anyone without a
// row yet (shouldn't normally happen once the seed has run) falls back
// to the same pending/inactive default.
export async function getMembersWithStatus() {
  const [members, renewals] = await Promise.all([getMembers(), getMemberRenewals()])
  return members.map((m) => {
    const row = renewals.find((r) => r.member_name === m.name)
    return { name: m.name, ...toStatus(row) }
  })
}

export async function getMyMembershipStatus() {
  const account = getAccount()
  if (!account) return { ...DEFAULT_STATUS, isActive: false }
  const renewals = await getMemberRenewals()
  const row = renewals.find((r) => r.member_name === account.name)
  return toStatus(row)
}

export async function updateMemberRenewal(
  memberName,
  { paymentStatus, membershipStart, membershipEnd, cycleLabel },
) {
  const { error } = await supabase.from('member_renewals').upsert(
    {
      member_name: memberName,
      payment_status: paymentStatus,
      membership_start: membershipStart || null,
      membership_end: membershipEnd || null,
      cycle_label: cycleLabel || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'member_name' },
  )
  if (error) {
    console.error('[mockMembershipStore] updateMemberRenewal failed:', error.message)
    return
  }
  logAction(`Treasurer updated renewal details for ${memberName}`)
}
