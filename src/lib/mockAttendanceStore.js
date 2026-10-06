// Real per-meeting attendance, taken by the Secretary (supabase/schema.sql:
// attendance). Replaces the fully local/fake AttendancePage.jsx +
// src/data/mockAttendance.js. Also read by mockRosterStore.js's
// scoreMemberForRole (via mockRolesStore.js's runAutoAssign) to blend real
// recorded attendance into VPE auto-assign scoring, alongside the static
// seeded members.attendance_percentage baseline.

import { supabase } from './supabaseClient.js'
import { buildAttendanceRoster } from './attendanceRoster.js'
import { getMeetings } from './mockRolesStore.js'
import { getAccount } from './mockAuth.js'
import {
  scoreAttendanceSubmission,
  scoreMeetingAttendance,
  scoreExcomAttendanceFloor,
} from './mockPointsStore.js'

// Meetings whose date has already arrived, most recent first, capped to a
// short list. Uses meeting.date <= today (string compare), NOT
// hoursUntilMeeting < 0 — hoursUntilMeeting is date-only granularity and
// stays >= 0 all day on the meeting's own date, but the Secretary needs to
// take attendance that same evening, right after the meeting ends.
export async function getRecentMeetingsForAttendance(limit = 5) {
  const meetings = await getMeetings()
  const today = new Date().toISOString().slice(0, 10)
  return meetings
    .filter((m) => m.date && m.date <= today && !m.cancelled)
    .slice(-limit)
    .reverse()
}

// Keep historical attendance independent of today's active roster.
export async function getAttendanceForMeeting(meetingId) {
  const clubId = getAccount()?.clubId
  const [memberResult, attendanceResult, meetingResult] = await Promise.all([
    supabase.from('members')
      .select('name, email, is_test_account, is_active, membership_start, membership_end')
      .eq('club_id', clubId),
    supabase.from('attendance').select('*').eq('meeting_id', meetingId).eq('club_id', clubId),
    supabase.from('meetings').select('meeting_date').eq('id', meetingId).eq('club_id', clubId).single(),
  ])
  if (memberResult.error || attendanceResult.error || meetingResult.error || !meetingResult.data?.meeting_date) {
    throw new Error('Could not load attendance. Refresh and try again.')
  }
  return buildAttendanceRoster(attendanceResult.data ?? [], memberResult.data ?? [], meetingResult.data.meeting_date)
}

// Batch upsert — the whole roster's present/absent state saved in one
// call, matching the "Submit Attendance" button being a single explicit
// action rather than autosaving every toggle. `meeting` is the caller's
// already-loaded meeting view (has .date/.time/.dateLabel), passed in
// rather than re-fetched here to avoid a circular import with
// mockRolesStore.js (which already imports this file for attendance
// stats) — only used for on-time points scoring. `entries` is
// [{ email, name, present }] — keyed by email (the roster's real
// identity), name carried along only to denormalize onto the row for
// display without a join.
export async function submitAttendance(meetingId, entries, meeting) {
  const account = getAccount()
  const submittedAt = new Date().toISOString()
  const rows = entries.map(({ email, name, present }) => ({
    meeting_id: meetingId,
    member_email: email,
    member_name: name,
    present,
    submitted_by_email: account?.email ?? null,
    updated_at: submittedAt,
    club_id: account?.clubId,
  }))
  const { error } = await supabase
    .from('attendance')
    .upsert(rows, { onConflict: 'meeting_id,member_email' })
  if (error) {
    console.error('[mockAttendanceStore] submitAttendance failed:', error.message)
    throw new Error('Could not save attendance — check your Secretary permissions and try again.')
  }
  if (meeting) {
    await scoreAttendanceSubmission(meeting, submittedAt)
    await scoreMeetingAttendance(meeting, entries)
    await scoreExcomAttendanceFloor(meeting, entries)
  }
}

// { [memberEmail]: { present, total } } across every recorded meeting — the
// shape mockRosterStore.scoreMemberForRole's attendanceStats param expects.
export async function getAttendanceStatsByMember(clubId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('member_email, present')
    .eq('club_id', clubId)
  if (error) {
    console.error('[mockAttendanceStore] getAttendanceStatsByMember failed:', error.message)
    return {}
  }
  const stats = {}
  for (const row of data ?? []) {
    const s = (stats[row.member_email] ??= { present: 0, total: 0 })
    s.total += 1
    if (row.present) s.present += 1
  }
  return stats
}
