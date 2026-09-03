// Referral points + activity log for the VPM's New Member Approvals page.
// Pending/approved signup data itself lives in mockMemberSignups.js
// (Supabase-backed). The referral dropdown now sources the real club
// roster (mockRosterStore.js) instead of a placeholder name pool, and
// the point awards are real member_points/excom_points rows (see
// mockPointsStore.js's awardReferralPoints/awardVpmReferralBonus) — the
// activity log below stays localStorage-only, it's just a feed, not the
// source of truth for points anymore.

import { getMembers } from './mockRosterStore.js'
import { awardReferralPoints, awardVpmReferralBonus } from './mockPointsStore.js'

const LOG_KEY = 'toasty_approvals_log'
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

export function getApprovalsLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export async function getReferralMembers() {
  const members = await getMembers()
  return members.map((m) => m.name)
}

export async function recordGuestAttended(memberName) {
  await awardReferralPoints(memberName, 'guest_attended', 6)
  logAction(`${memberName}'s guest attended the meeting — +6 points`)
}

export async function recordGuestConverted(memberName) {
  await Promise.all([
    awardReferralPoints(memberName, 'guest_converted', 8),
    awardVpmReferralBonus(),
  ])
  logAction(
    `${memberName}'s guest converted to a member — +8 points to ${memberName}, +10 points to VPM`,
  )
}
