export function visitMeetingDates(meetings) {
  return [...new Set(meetings.map((meeting) => meeting.meeting_date))].sort()
}

export function formatVisitDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}
