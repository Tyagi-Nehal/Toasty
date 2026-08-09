// All roles start open so real auto-assignment (mockRolesStore.js +
// mockRosterStore.js) picks real club members for every role, not just
// whichever happened to be left open in an old placeholder seed.
// '__me__' marks the current signed-in mock member's own self-selection.

function allOpenRoles(overrides = {}) {
  return {
    saa: { status: 'open' },
    po: { status: 'open' },
    tmod: { status: 'open' },
    ge: { status: 'open' },
    ttm: { status: 'open' },
    'speaker-1': { status: 'open' },
    'speaker-2': { status: 'open' },
    'speaker-3': { status: 'open' },
    'evaluator-1': { status: 'open' },
    'evaluator-2': { status: 'open' },
    'evaluator-3': { status: 'open' },
    timer: { status: 'open' },
    'ah-counter': { status: 'open' },
    grammarian: { status: 'open' },
    listener: { status: 'open' },
    ...overrides,
  }
}

export const initialMeetings = [
  {
    id: 'meeting-1',
    label: 'Meeting 1',
    dateLabel: 'Thursday, Feb 12',
    time: '5:15 PM',
    hoursUntilMeeting: 18,
    myRoleId: null,
    roles: allOpenRoles(),
  },
  {
    id: 'meeting-2',
    label: 'Meeting 2',
    dateLabel: 'Thursday, Feb 19',
    time: '5:15 PM',
    hoursUntilMeeting: 40,
    myRoleId: 'evaluator-1',
    roles: allOpenRoles({
      'evaluator-1': { status: 'taken', takenBy: '__me__' },
    }),
  },
  {
    id: 'meeting-3',
    label: 'Meeting 3',
    dateLabel: 'Thursday, Feb 26',
    time: '5:15 PM',
    hoursUntilMeeting: 170,
    myRoleId: null,
    roles: allOpenRoles(),
  },
]
