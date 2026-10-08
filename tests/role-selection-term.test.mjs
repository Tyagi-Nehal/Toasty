import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getRoleSelectionMeetings } from '../src/lib/roleSelectionTerm.js'

test('Role picker includes more than three future meetings through December 31', () => {
  const meetings = [
    { id: 1, date: '2026-09-01', hoursUntilMeeting: -24 },
    ...['2026-10-15','2026-10-22','2026-11-05','2026-12-17','2026-12-31','2027-01-07']
      .map((date, index) => ({ id: index + 2, date, hoursUntilMeeting: 24 + index })),
  ]
  assert.deepEqual(getRoleSelectionMeetings(meetings).map((m) => m.id), [1,2,3,4,5,6])
  assert.deepEqual(getRoleSelectionMeetings([]), [])
  // Rescheduling beyond the term removes a future meeting from the picker.
  assert.deepEqual(getRoleSelectionMeetings([{ ...meetings[5], date: '2027-01-01' }]), [])
})
