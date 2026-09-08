// Speaker/evaluator slots go up to 8 — enough headroom for a
// speech-marathon-style meeting with more than the usual 3 pairs (a
// specific ask: "the next meeting will be speech marathon only... 6
// speakers"). Which of these actually exist on a given meeting is a
// per-meeting choice made in Role Management (addMeetingRole/
// removeMeetingRole in mockRolesStore.js) — this catalog is just the
// menu of role *types* that can be added to a meeting, not a fixed set
// every meeting has.
const MAX_SPEAKER_SLOTS = 8

export const roleCatalog = [
  {
    id: 'saa',
    name: 'Sergeant at Arms',
    description: 'Opens the meeting and manages the room/logistics.',
  },
  {
    id: 'po',
    name: 'Presiding Officer',
    description: 'Opens and closes the meeting and handles club business.',
  },
  {
    id: 'tmod',
    name: 'Toastmaster of the Day',
    description: 'Hosts and runs the meeting from start to finish.',
  },
  {
    id: 'ge',
    name: 'General Evaluator',
    description: 'Evaluates the meeting as a whole and leads the evaluation team.',
  },
  {
    id: 'ttm',
    name: 'Table Topics Master',
    description: 'Runs the impromptu speaking segment.',
  },
  ...Array.from({ length: MAX_SPEAKER_SLOTS }, (_, i) => ({
    id: `speaker-${i + 1}`,
    name: `Prepared Speaker ${i + 1}`,
    description: 'Delivers a prepared speech project.',
  })),
  ...Array.from({ length: MAX_SPEAKER_SLOTS }, (_, i) => ({
    id: `evaluator-${i + 1}`,
    name: `Individual Evaluator ${i + 1}`,
    description: `Evaluates Prepared Speaker ${i + 1}'s speech.`,
  })),
  {
    id: 'timer',
    name: 'Timer',
    description: 'Tracks and signals speech durations.',
  },
  {
    id: 'ah-counter',
    name: 'Ah-Counter',
    description: 'Counts filler words and verbal tics.',
  },
  {
    id: 'grammarian',
    name: 'Grammarian',
    description: 'Tracks language use and presents the Word of the Day.',
  },
  {
    id: 'listener',
    name: 'Listener',
    description: 'Actively listens and shares takeaways at the end of the meeting.',
  },
]

// The starter set a newly created meeting gets by default (createMeetingForDate
// in mockRolesStore.js) — the standard weekly format, 3 speaker/evaluator
// pairs. The VPE customizes per meeting from there via Role Management's
// add/remove (any id in roleCatalog above, e.g. speaker-4 for a speech
// marathon), so this is deliberately a subset, not the full catalog.
export const DEFAULT_ROLE_IDS = [
  'saa',
  'po',
  'tmod',
  'ge',
  'ttm',
  'speaker-1',
  'speaker-2',
  'speaker-3',
  'evaluator-1',
  'evaluator-2',
  'evaluator-3',
  'timer',
  'ah-counter',
  'grammarian',
  'listener',
]
