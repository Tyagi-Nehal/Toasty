// Real Treasurer-controlled membership renewals (supabase/schema.sql:
// member_renewals). The member list itself is no longer the seeded/
// hardcoded roster (mockRosterStore.js's `members` table, which exists
// only to feed VPE's role auto-assign scoring) — it's every real,
// currently-approved account: VPM-approved signups (member_signups) plus
// ExCom appointees (auto-approved via role match, never go through
// member_signups). Matched by email throughout, not name — a real Google
// account's email is stable and unique, unlike a freeform typed name
// (e.g. roster "Isha" vs. ExCom-registered "Isha Karn" never matching).
//
// Active/inactive is derived, not stored: a member is active only if
// membership_end is set and is today or later.

import { supabase } from './supabaseClient.js'
import { getAccount } from './mockAuth.js'
import { getApprovedSignups } from './mockMemberSignups.js'
import { getExcomAppointments } from './mockExcomRegistry.js'
import { scoreRenewal } from './mockPointsStore.js'

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

function normalizeEmail(email) {
  return (email ?? '').trim().toLowerCase()
}

export function isActive(membershipEnd) {
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
  const active = isActive(row.membership_end)
  return {
    // A member who's lapsed into Inactive (didn't get renewed into a new
    // term) shouldn't keep showing "Paid" from whatever term they last
    // paid for — that reads as if they're covered when they're not. This
    // mirrors the symmetric rule on the way in: renewing into an active
    // window auto-marks Paid (see autoPaymentStatus in
    // RenewalManagementPage.jsx); lapsing back out of one auto-reverts it.
    paymentStatus: active || row.payment_status !== 'paid' ? row.payment_status : 'pending',
    membershipStart: row.membership_start,
    membershipEnd: row.membership_end,
    cycleLabel: row.cycle_label,
    isActive: active,
  }
}

// Every real, currently-approved club member — no hardcoded/seeded
// names. Deduped by email; if the same email shows up in both lists
// (e.g. a member later appointed to ExCom), the ExCom name wins since
// getExcomAppointments() is ordered oldest-first and is applied second,
// so the most recent appointment's name is what's kept.
export async function getApprovedClubMembers() {
  const [signups, excom] = await Promise.all([getApprovedSignups(), getExcomAppointments()])
  const byEmail = new Map()
  for (const s of signups) {
    const email = normalizeEmail(s.email)
    if (email) byEmail.set(email, { name: s.name, email })
  }
  for (const e of excom) {
    const email = normalizeEmail(e.email)
    if (email) byEmail.set(email, { name: e.name, email })
  }
  return [...byEmail.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export async function getMemberRenewals() {
  const { data, error } = await supabase.from('member_renewals').select('*')
  if (error) console.error('[mockMembershipStore] getMemberRenewals failed:', error.message)
  return data ?? []
}

// Real approved members left-joined with renewal status by email —
// anyone without a renewal row yet (a newly-approved member the
// Treasurer hasn't set dues for) falls back to the pending/inactive
// default.
export async function getMembersWithStatus() {
  const [members, renewals] = await Promise.all([getApprovedClubMembers(), getMemberRenewals()])
  return members.map((m) => {
    const row = renewals.find((r) => normalizeEmail(r.email) === m.email)
    return { name: m.name, email: m.email, ...toStatus(row) }
  })
}

export async function getMyMembershipStatus() {
  const account = getAccount()
  if (!account) return { ...DEFAULT_STATUS, isActive: false }
  const renewals = await getMemberRenewals()
  const row = renewals.find((r) => normalizeEmail(r.email) === normalizeEmail(account.email))
  return toStatus(row)
}

export async function updateMemberRenewal(
  email,
  memberName,
  { paymentStatus, membershipStart, membershipEnd, cycleLabel },
) {
  const normalizedEmail = normalizeEmail(email)

  // Checked before the upsert — whether this member already had a row is
  // what tells Treasurer scoring "new member's first renewal" (worth
  // more) from "existing member renewing again" (routine).
  const { data: existingRow } = await supabase
    .from('member_renewals')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  const { error } = await supabase.from('member_renewals').upsert(
    {
      email: normalizedEmail,
      member_name: memberName,
      payment_status: paymentStatus,
      membership_start: membershipStart || null,
      membership_end: membershipEnd || null,
      cycle_label: cycleLabel || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' },
  )
  if (error) {
    console.error('[mockMembershipStore] updateMemberRenewal failed:', error.message)
    return
  }
  logAction(`Treasurer updated renewal details for ${memberName}`)
  await scoreRenewal(normalizedEmail, Boolean(existingRow))
}
