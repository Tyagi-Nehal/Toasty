// Current club term requested for advance role bookings.
export const ROLE_SELECTION_TERM_END = '2026-12-31'

export function getRoleSelectionMeetings(meetings) {
  return meetings.filter((meeting) =>
    (meeting.hoursUntilMeeting ?? -1) < 0 ||
    (meeting.date && meeting.date <= ROLE_SELECTION_TERM_END),
  )
}
