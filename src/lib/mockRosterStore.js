// Real club roster + role history (supabase/schema.sql: members,
// role_history — seeded once from the club's real attendance sheet and
// meeting roster, see supabase/seed-roster.sql). Powers the role
// auto-assignment algorithm in mockRolesStore.js. The meetings/agenda
// shell itself is still mock/localStorage-only (not migrated in this
// pass), so "meeting date" recorded here is when the assignment action
// actually happened in real time, not the mock meeting's fictional
// display date.

import { supabase } from './supabaseClient.js'

const RENEWAL_LOG_KEY = 'toasty_roster_renewal_log'
const MAX_LOG_ENTRIES = 25

function logRenewalAction(message) {
  const entry = { id: crypto.randomUUID(), message, time: new Date().toISOString() }
  try {
    const raw = localStorage.getItem(RENEWAL_LOG_KEY)
    const existing = raw ? JSON.parse(raw) : []
    localStorage.setItem(RENEWAL_LOG_KEY, JSON.stringify([entry, ...existing].slice(0, MAX_LOG_ENTRIES)))
  } catch {
    localStorage.setItem(RENEWAL_LOG_KEY, JSON.stringify([entry]))
  }
}

export function getRosterRenewalLog() {
  try {
    const raw = localStorage.getItem(RENEWAL_LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Active members only — this is the pool attendance rosters and role
// auto-assign draw from, so an inactive member is excluded everywhere
// this feeds, not just hidden with a badge.
export async function getMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) console.error('[mockRosterStore] getMembers failed:', error.message)
  return (data ?? []).map((m) => ({
    name: m.name,
    attendancePercentage: m.attendance_percentage,
  }))
}

// Makes sure `name` exists as a roster row — nothing else in the app
// could otherwise ever add a new person to this table (it was only ever
// seeded once via SQL from the original attendance sheet). Called from
// wherever a real person becomes real in the app: an ExCom appointment
// (mockExcomRegistry.js) or an approved member signup
// (mockMemberSignups.js). A no-op if that name is already on the
// roster — never resets an existing member's active/payment status,
// only ever adds the row so the Treasurer has someone to activate.
export async function ensureRosterMember(name) {
  const trimmed = (name ?? '').trim()
  if (!trimmed) return
  const { error } = await supabase
    .from('members')
    .upsert({ name: trimmed }, { onConflict: 'name', ignoreDuplicates: true })
  if (error) console.error('[mockRosterStore] ensureRosterMember failed:', error.message)
}

// Every roster member regardless of active status, with their payment/
// term info — for the Treasurer's Renewal Management page. getMembers()
// above deliberately excludes inactive members everywhere else.
export async function getRosterWithStatus() {
  const { data, error } = await supabase.from('members').select('*').order('name')
  if (error) {
    console.error('[mockRosterStore] getRosterWithStatus failed:', error.message)
    return []
  }
  return (data ?? []).map((m) => ({
    name: m.name,
    attendancePercentage: m.attendance_percentage,
    isActive: m.is_active,
    paymentStatus: m.payment_status,
    membershipStart: m.membership_start,
    membershipEnd: m.membership_end,
    cycleLabel: m.cycle_label,
  }))
}

// Payment/term tracking lives directly on the roster (see schema.sql) —
// marking a member Paid is what makes them active, which is what then
// makes them eligible for attendance/role auto-assign via getMembers()
// above. Called from RenewalManagementPage.jsx.
export async function updateRosterRenewal(name, { paymentStatus, membershipStart, membershipEnd, cycleLabel }) {
  const { error } = await supabase
    .from('members')
    .update({
      payment_status: paymentStatus,
      membership_start: membershipStart || null,
      membership_end: membershipEnd || null,
      cycle_label: cycleLabel || null,
      is_active: paymentStatus === 'paid',
    })
    .eq('name', name)
  if (error) {
    console.error('[mockRosterStore] updateRosterRenewal failed:', error.message)
    throw new Error('Could not update this member.')
  }
  logRenewalAction(
    paymentStatus === 'paid'
      ? `Treasurer marked ${name} as Paid${cycleLabel ? ` for ${cycleLabel}` : ''}`
      : `Treasurer marked ${name} as Unpaid`,
  )
}

// Most-recent-first, so callers can just take the first match per member.
export async function getRoleHistory() {
  const { data, error } = await supabase
    .from('role_history')
    .select('*')
    .order('meeting_date', { ascending: false })
  if (error) console.error('[mockRosterStore] getRoleHistory failed:', error.message)
  return (data ?? []).map((r) => ({
    memberName: r.member_name,
    roleId: r.role_id,
    meetingDate: r.meeting_date,
  }))
}

export async function recordRoleAssignment(memberName, roleId) {
  const { error } = await supabase.from('role_history').insert({
    member_name: memberName,
    role_id: roleId,
    meeting_date: new Date().toISOString().slice(0, 10),
  })
  if (error) console.error('[mockRosterStore] recordRoleAssignment failed:', error.message)
}

function daysSinceScore(dateStr) {
  const days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  return Math.min(1, Math.max(0, days) / 180) // caps at 1 after ~6 months
}

// Weights mirror the Role Management page's existing sliders
// (Attendance/Role recency/Frequency), renormalized to sum to 1 since
// "Projects completed" has no real data source and isn't used.
export const scoringWeights = {
  attendance: 0.4,
  roleRecency: 0.3,
  frequency: 0.3,
}

// Higher score = better fit for this role right now. Real signals only:
// attendance % (reliability), how recently/whether they've done this
// exact role before (rotation — never-done-it scores highest), and how
// recently they've had any role at all (fairness/turn-taking).
//
// attendanceStats (optional): { [memberName]: { present, total } } from
// mockAttendanceStore.getAttendanceStatsByMember() — real per-meeting
// attendance recorded by the Secretary. A member with at least one real
// recorded meeting uses their real present/total ratio; a member with no
// real rows yet falls back to the static seeded members.attendance_percentage
// column, so historical seed data isn't discarded on day one.
export function scoreMemberForRole(member, roleId, roleHistory, attendanceStats = {}) {
  const stats = attendanceStats[member.name]
  const attendanceScore =
    stats && stats.total > 0
      ? stats.present / stats.total
      : (member.attendancePercentage ?? 0) / 100

  const thisRoleHistory = roleHistory.filter(
    (r) => r.memberName === member.name && r.roleId === roleId,
  )
  const roleRecencyScore =
    thisRoleHistory.length === 0 ? 1 : daysSinceScore(thisRoleHistory[0].meetingDate)

  const anyRoleHistory = roleHistory.filter((r) => r.memberName === member.name)
  const frequencyScore =
    anyRoleHistory.length === 0 ? 1 : daysSinceScore(anyRoleHistory[0].meetingDate)

  return (
    attendanceScore * scoringWeights.attendance +
    roleRecencyScore * scoringWeights.roleRecency +
    frequencyScore * scoringWeights.frequency
  )
}
