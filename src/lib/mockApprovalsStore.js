// Mutable store for the VPM's New Member Approvals page — seeded from the
// static placeholder pending list, then persisted to localStorage so
// approve/reject actions actually stick (same pattern as
// mockClubRegistry.js's founder-review flow). Also backs the ExCom
// Dashboard's "Pending Approvals" count so both stay in sync.

import { pendingApprovals as seedApprovals } from '../data/mockPendingApprovals.js'

const STORAGE_KEY = 'toasty_member_approvals'
const LOG_KEY = 'toasty_approvals_log'
const MAX_LOG_ENTRIES = 25

// Same generic placeholder pool used for role/agenda mock data — reused
// here as the referral dropdown's member list.
const NAME_POOL = [
  'Riya', 'Kabir', 'Ananya', 'Dev', 'Meera', 'Neha', 'Vikram',
  'Priyanka', 'Rohan', 'Aarav', 'Diya', 'Simran', 'Arjun', 'Tanvi',
]

function readState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fall through to seed
  }
  return seedApprovals.map((a) => ({ ...a, status: 'pending' }))
}

function writeState(list) {
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

export function getApprovalsLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getPendingApprovals() {
  return readState().filter((a) => a.status === 'pending')
}

export function getApprovedMembers() {
  return readState().filter((a) => a.status === 'approved')
}

export function approveMember(id) {
  const list = readState()
  const entry = list.find((a) => a.id === id)
  if (!entry) return
  writeState(
    list.map((a) =>
      a.id === id ? { ...a, status: 'approved', approvedAt: new Date().toISOString() } : a,
    ),
  )
  logAction(`VPM approved ${entry.name}'s signup request`)
}

export function rejectMember(id) {
  const list = readState()
  const entry = list.find((a) => a.id === id)
  if (!entry) return
  writeState(list.map((a) => (a.id === id ? { ...a, status: 'rejected' } : a)))
  logAction(`VPM rejected ${entry.name}'s signup request`)
}

export function getReferralMembers() {
  return NAME_POOL
}

export function recordGuestAttended(memberName) {
  logAction(`${memberName}'s guest attended the meeting — +6 points`)
}

export function recordGuestConverted(memberName) {
  logAction(
    `${memberName}'s guest converted to a member — +8 points to ${memberName}, +10 points to VPM`,
  )
}
