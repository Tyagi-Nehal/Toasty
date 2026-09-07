// Real per-meeting attendance, taken by the Secretary (supabase/schema.sql:
// attendance). Replaces the fully local/fake AttendancePage.jsx +
// src/data/mockAttendance.js. Also read by mockRosterStore.js's
// scoreMemberForRole (via mockRolesStore.js's runAutoAssign) to blend real
// recorded attendance into VPE auto-assign scoring, alongside the static
// seeded members.attendance_percentage baseline.

import { supabase } from './supabaseClient.js'
import { getMembers } from './mockRosterStore.js'
import { getMeetings } from './mockRolesStore.js'
import { getAccount } from './mockAuth.js'
import { scoreAttendanceSubmission } from './mockPointsStore.js'

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

// Real roster joined with any existing attendance rows for this meeting.
// Anyone with no row yet defaults to present:true (Secretary unchecks
// absentees, same UX the old fake page had — just against real data now).
export async function getAttendanceForMeeting(meetingId) {
  const [members, { data: rows }] = await Promise.all([
    getMembers(),
    supabase.from('attendance').select('*').eq('meeting_id', meetingId),
  ])
  const byEmail = new Map((rows ?? []).map((r) => [r.member_email, r.present]))
  return {
    alreadySubmitted: (rows?.length ?? 0) > 0,
    roster: members.map((m) => ({
      name: m.name,
      email: m.email,
      present: byEmail.has(m.email) ? byEmail.get(m.email) : true,
    })),
  }
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
  }))
  const { error } = await supabase
    .from('attendance')
    .upsert(rows, { onConflict: 'meeting_id,member_email' })
  if (error) {
    console.error('[mockAttendanceStore] submitAttendance failed:', error.message)
    throw new Error('Could not save attendance — check your Secretary permissions and try again.')
  }
  if (meeting) await scoreAttendanceSubmission(meeting, submittedAt)
}

// { [memberEmail]: { present, total } } across every recorded meeting — the
// shape mockRosterStore.scoreMemberForRole's attendanceStats param expects.
export async function getAttendanceStatsByMember() {
  const { data, error } = await supabase.from('attendance').select('member_email, present')
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
