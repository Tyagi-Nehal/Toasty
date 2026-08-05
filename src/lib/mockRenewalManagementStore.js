// Roster for the Treasurer's Renewal Management page. The static seed list
// (other generic members) is persisted/mutable like mockApprovalsStore.js,
// and merged live with the signed-in member's own real renewal record from
// mockRenewalStore.js, so confirming "Alex Rao" here actually updates what
// Alex sees on their own profile — not a second disconnected mock member.

import { renewals as seedRenewals } from '../data/mockRenewals.js'
import { getAccount } from './mockAuth.js'
import { getRenewalStatus, confirmRenewal as confirmMyRenewal } from './mockRenewalStore.js'
import { pushNotification } from './mockNotificationsStore.js'

const STORAGE_KEY = 'toasty_renewal_roster'
const LOG_KEY = 'toasty_renewal_log'
const MAX_LOG_ENTRIES = 25

export const CURRENT_TERM = 'Feb 2026 – Jul 2026'
const ME_ID = 'me'

function readSeedRoster() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fall through to seed
  }
  return seedRenewals
}

function writeSeedRoster(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

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

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function myEntry() {
  const account = getAccount()
  if (!account) return null
  const renewal = getRenewalStatus()
  const status =
    renewal.status === 'paid' ? 'Paid' : renewal.status === 'awaiting_confirmation' ? 'Pending' : 'Pending'
  return {
    id: ME_ID,
    name: account.name,
    status,
    dateClaimed: formatDate(renewal.claimedAt),
    utr: renewal.utr,
    isMe: true,
  }
}

export function getRenewalRoster() {
  const me = myEntry()
  return me ? [me, ...readSeedRoster()] : readSeedRoster()
}

export function confirmRenewal(id) {
  if (id === ME_ID) {
    confirmMyRenewal(CURRENT_TERM)
    logAction(`Treasurer confirmed renewal for ${getAccount()?.name} — +1 point`)
    pushNotification({
      type: 'renewal_confirmed',
      message: 'Your membership renewal was confirmed by the Treasurer.',
      link: '/profile',
    })
    return
  }
  const list = readSeedRoster()
  const entry = list.find((r) => r.id === id)
  if (!entry) return
  writeSeedRoster(
    list.map((r) => (r.id === id ? { ...r, status: 'Paid' } : r)),
  )
  logAction(`Treasurer confirmed renewal for ${entry.name} — +1 point`)
}
