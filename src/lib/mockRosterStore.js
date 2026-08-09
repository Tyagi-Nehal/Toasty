// Real club roster + role history (supabase/schema.sql: members,
// role_history — seeded once from the club's real attendance sheet and
// meeting roster, see supabase/seed-roster.sql). Powers the role
// auto-assignment algorithm in mockRolesStore.js. The meetings/agenda
// shell itself is still mock/localStorage-only (not migrated in this
// pass), so "meeting date" recorded here is when the assignment action
// actually happened in real time, not the mock meeting's fictional
// display date.

import { supabase } from './supabaseClient.js'

export async function getMembers() {
  const { data } = await supabase.from('members').select('*').order('name')
  return (data ?? []).map((m) => ({
    name: m.name,
    attendancePercentage: m.attendance_percentage,
  }))
}

// Most-recent-first, so callers can just take the first match per member.
export async function getRoleHistory() {
  const { data } = await supabase
    .from('role_history')
    .select('*')
    .order('meeting_date', { ascending: false })
  return (data ?? []).map((r) => ({
    memberName: r.member_name,
    roleId: r.role_id,
    meetingDate: r.meeting_date,
  }))
}

export async function recordRoleAssignment(memberName, roleId) {
  await supabase.from('role_history').insert({
    member_name: memberName,
    role_id: roleId,
    meeting_date: new Date().toISOString().slice(0, 10),
  })
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
export function scoreMemberForRole(member, roleId, roleHistory) {
  const attendanceScore = (member.attendancePercentage ?? 0) / 100

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
