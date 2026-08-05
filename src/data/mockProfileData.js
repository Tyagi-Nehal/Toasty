// Mock role history + points breakdown for the signed-in member. Meeting
// dates line up with the same demo meetings used across Agenda/Poll/MOM.

export const roleHistory = [
  { meetingDate: 'Thursday, Feb 12', role: 'Table Topics Master', points: 10 },
  { meetingDate: 'Thursday, Feb 5', role: 'Individual Evaluator', points: 7 },
  { meetingDate: 'Thursday, Jan 29', role: 'Timer', points: 5 },
  { meetingDate: 'Thursday, Jan 22', role: 'Prepared Speaker', points: 9 },
]

export const pointsBreakdown = {
  total: 96,
  thisMonth: 18,
  byCategory: {
    roleCompletion: 62,
    attendance: 24,
    recognition: 10,
  },
}
