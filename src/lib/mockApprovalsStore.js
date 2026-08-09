// Referral points + activity log for the VPM's New Member Approvals page.
// Pending/approved signup data itself lives in mockMemberSignups.js
// (Supabase-backed) — this file now only covers the cosmetic
// point-tracking pieces, which stay localStorage-only for now.

const LOG_KEY = 'toasty_approvals_log'
const MAX_LOG_ENTRIES = 25

// Same generic placeholder pool used for role/agenda mock data — reused
// here as the referral dropdown's member list.
const NAME_POOL = [
  'Riya', 'Kabir', 'Ananya', 'Dev', 'Meera', 'Neha', 'Vikram',
  'Priyanka', 'Rohan', 'Aarav', 'Diya', 'Simran', 'Arjun', 'Tanvi',
]

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
