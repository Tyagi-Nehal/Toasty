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

// Meetings whose date has already arrived, most recent first, capped to a
// short list. Uses meeting.date <= today (string compare), NOT
// hoursUntilMeeting < 0 — hoursUntilMeeting is date-only granularity and
// stays >= 0 all day on the meeting's own date, but the Secretary needs to
// take attendance that same evening, right after the meeting ends.
export async function getRecentMeetingsForAttendance(limit = 5) {
  const meetings = await getMeetings()
  const today = new Date().toISOString().slice(0, 10)
  return meetings
    .filter((m) => m.date && m.date <= today)
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
  const byName = new Map((rows ?? []).map((r) => [r.member_name, r.present]))
  return {
    alreadySubmitted: (rows?.length ?? 0) > 0,
    roster: members.map((m) => ({
      name: m.name,
      present: byName.has(m.name) ? byName.get(m.name) : true,
    })),
  }
}

// Batch upsert — the whole roster's present/absent state saved in one
// call, matching the "Submit Attendance" button being a single explicit
// action rather than autosaving every toggle.
export async function submitAttendance(meetingId, presentByName) {
  const account = getAccount()
  const rows = Object.entries(presentByName).map(([member_name, present]) => ({
    meeting_id: meetingId,
    member_name,
    present,
    submitted_by_email: account?.email ?? null,
    updated_at: new Date().toISOString(),
  }))
  const { error } = await supabase
    .from('attendance')
    .upsert(rows, { onConflict: 'meeting_id,member_name' })
  if (error) console.error('[mockAttendanceStore] submitAttendance failed:', error.message)
}

// { [memberName]: { present, total } } across every recorded meeting — the
// shape mockRosterStore.scoreMemberForRole's attendanceStats param expects.
export async function getAttendanceStatsByMember() {
  const { data, error } = await supabase.from('attendance').select('member_name, present')
  if (error) {
    console.error('[mockAttendanceStore] getAttendanceStatsByMember failed:', error.message)
    return {}
  }
  const stats = {}
  for (const row of data ?? []) {
    const s = (stats[row.member_name] ??= { present: 0, total: 0 })
    s.total += 1
    if (row.present) s.present += 1
  }
  return stats
}
