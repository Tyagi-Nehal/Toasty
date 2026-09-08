// Real cron-triggered replacement for the opportunistic "run auto-assign
// whenever a VPE/President's session happens to load the page" trigger in
// src/lib/mockRolesStore.js (runDueAutoAssignments/getMeetings). That
// approach never fires at all if nobody with the right role opens the
// app after the Saturday 9 AM cutoff. This function does the identical
// check and identical scoring, but runs on a real schedule (see the
// README in this folder) regardless of whether anyone's using the app.
//
// Uses the SERVICE ROLE key, not the anon key — this is trusted
// infrastructure invoked by cron, not a client request, so it
// intentionally bypasses RLS. Never expose SUPABASE_SERVICE_ROLE_KEY to
// the frontend; it only ever lives as a Supabase secret for this function.
//
// The three guard conditions below are ported unchanged from
// runDueAutoAssignments in mockRolesStore.js:
//   1. Only the single next active (uncancelled, upcoming) meeting is
//      ever touched — never reaches ahead into meeting #2/#3 just
//      because the VPE fell behind finalizing meeting #1.
//   2. The cutoff must have passed *recently* (within DUE_WINDOW_MS) —
//      stops a long-past historical meeting (e.g. one VPPR is
//      backfilling photos for, which has no real role rows and whose
//      cutoff is always ancient) from being treated as "due."
//   3. There must be at least one open, non-VPE-only role left to fill.

import { createClient } from 'npm:@supabase/supabase-js@2'

const DUE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000 // 14 days
const VPE_ONLY_ROLE_IDS = ['po', 'saa']

// Same weights as scoringWeights in src/lib/mockRosterStore.js.
const SCORING_WEIGHTS = { attendance: 0.4, roleRecency: 0.3, frequency: 0.3 }

interface Member {
  name: string
  email: string | null
  attendance_percentage: number | null
}

interface RoleHistoryRow {
  member_name: string
  role_id: string
  meeting_date: string
}

interface AttendanceStats {
  [memberName: string]: { present: number; total: number }
}

// Members self-select freely up to the Saturday before the meeting,
// 9:00 AM; whatever's still open after that is fair game for
// auto-assign. Identical to getAutoAssignCutoff in mockRolesStore.js.
function getAutoAssignCutoff(meetingDate: string | null): Date | null {
  if (!meetingDate) return null
  const meeting = new Date(`${meetingDate}T00:00:00`)
  const day = meeting.getDay() // Sun=0 .. Sat=6
  const daysBack = day === 6 ? 7 : (day + 1) % 7
  const cutoff = new Date(meeting)
  cutoff.setDate(cutoff.getDate() - daysBack)
  cutoff.setHours(9, 0, 0, 0)
  return cutoff
}

function daysSinceScore(dateStr: string): number {
  const days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  return Math.min(1, Math.max(0, days) / 180) // caps at 1 after ~6 months
}

// Identical to scoreMemberForRole in src/lib/mockRosterStore.js.
function scoreMemberForRole(
  member: Member,
  roleId: string,
  roleHistory: RoleHistoryRow[],
  attendanceStats: AttendanceStats,
): number {
  const stats = attendanceStats[member.name]
  const attendanceScore =
    stats && stats.total > 0
      ? stats.present / stats.total
      : (member.attendance_percentage ?? 0) / 100

  const thisRoleHistory = roleHistory.filter(
    (r) => r.member_name === member.name && r.role_id === roleId,
  )
  const roleRecencyScore =
    thisRoleHistory.length === 0 ? 1 : daysSinceScore(thisRoleHistory[0].meeting_date)

  const anyRoleHistory = roleHistory.filter((r) => r.member_name === member.name)
  const frequencyScore =
    anyRoleHistory.length === 0 ? 1 : daysSinceScore(anyRoleHistory[0].meeting_date)

  return (
    attendanceScore * SCORING_WEIGHTS.attendance +
    roleRecencyScore * SCORING_WEIGHTS.roleRecency +
    frequencyScore * SCORING_WEIGHTS.frequency
  )
}

Deno.serve(async (req) => {
  // Defense in depth on top of JWT verification: even if this function
  // were ever deployed with --no-verify-jwt, a caller still needs this
  // secret to trigger a real write. Set via `supabase secrets set
  // CRON_SECRET=...` and pass the same value as a header from whatever
  // schedules this (see README.md in this folder).
  const expectedSecret = Deno.env.get('CRON_SECRET')
  if (expectedSecret && req.headers.get('x-cron-secret') !== expectedSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: meetings, error: meetingsError } = await supabase
    .from('meetings')
    .select('*')
    .order('meeting_date', { ascending: true })
  if (meetingsError) {
    return new Response(JSON.stringify({ error: meetingsError.message }), { status: 500 })
  }

  const now = Date.now()
  const views = (meetings ?? []).map((m) => {
    const hoursUntilMeeting = m.meeting_date
      ? Math.round((new Date(`${m.meeting_date}T00:00:00`).getTime() - now) / 3600000)
      : null
    const autoAssignCutoff = getAutoAssignCutoff(m.meeting_date)
    return {
      ...m,
      hoursUntilMeeting,
      autoAssignCutoff,
      pastCutoff: autoAssignCutoff ? now >= autoAssignCutoff.getTime() : true,
    }
  })

  // Only the single next active (uncancelled, upcoming) meeting.
  const next = views.find((m) => !m.cancelled && (m.hoursUntilMeeting ?? -1) >= 0) ?? null

  const isDue =
    next &&
    !next.finalized &&
    next.pastCutoff &&
    next.autoAssignCutoff &&
    now - next.autoAssignCutoff.getTime() <= DUE_WINDOW_MS

  if (!isDue) {
    return new Response(JSON.stringify({ ran: false, reason: 'not due' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: assignments } = await supabase
    .from('meeting_role_assignments')
    .select('*')
    .eq('meeting_id', next!.id)

  const openRoles = (assignments ?? []).filter(
    (a) => a.status === 'open' && !VPE_ONLY_ROLE_IDS.includes(a.role_id),
  )
  if (openRoles.length === 0) {
    return new Response(JSON.stringify({ ran: false, reason: 'no open roles' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const usedNames = new Set(
    (assignments ?? []).map((a) => a.taken_by_name).filter(Boolean),
  )

  const [{ data: members }, { data: roleHistory }, { data: attendanceRows }] = await Promise.all([
    supabase.from('members').select('*').order('name'),
    supabase.from('role_history').select('*').order('meeting_date', { ascending: false }),
    supabase.from('attendance').select('member_name, present'),
  ])

  const attendanceStats: AttendanceStats = {}
  for (const row of attendanceRows ?? []) {
    const s = (attendanceStats[row.member_name] ??= { present: 0, total: 0 })
    s.total += 1
    if (row.present) s.present += 1
  }

  let filledCount = 0
  const newAssignments: { name: string; email: string | null; roleId: string }[] = []
  for (const role of openRoles) {
    const available = (members ?? []).filter((m: Member) => !usedNames.has(m.name))
    if (available.length === 0) break
    const [best] = available
      .map((member: Member) => ({
        member,
        score: scoreMemberForRole(member, role.role_id, roleHistory ?? [], attendanceStats),
      }))
      .sort((a, b) => b.score - a.score)
    newAssignments.push({ name: best.member.name, email: best.member.email ?? null, roleId: role.role_id })
    usedNames.add(best.member.name)
    filledCount += 1
  }

  for (const assignment of newAssignments) {
    await supabase
      .from('meeting_role_assignments')
      .update({ status: 'auto', taken_by_name: assignment.name, taken_by_email: assignment.email })
      .eq('meeting_id', next!.id)
      .eq('role_id', assignment.roleId)
    await supabase.from('role_history').insert({
      member_name: assignment.name,
      member_email: assignment.email,
      role_id: assignment.roleId,
      meeting_date: next!.meeting_date,
    })
  }

  return new Response(
    JSON.stringify({ ran: true, meetingId: next!.id, filledCount }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
})
