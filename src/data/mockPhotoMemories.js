// Past-meeting photo/certificate seeds for the Photo Memories page.
// Uses picsum.photos seeded placeholders, same pattern as the public pages —
// no real photos of members exist in this prototype.

export const photoMemories = [
  {
    id: 'meeting-past-1',
    dateLabel: 'Thursday, Feb 12',
    theme: 'Turning Points',
    coverSeed: 'toasty-meeting-1-cover',
    photoSeeds: [
      'toasty-meeting-1-cover',
      'toasty-meeting-1-b',
      'toasty-meeting-1-c',
      'toasty-meeting-1-d',
      'toasty-meeting-1-e',
      'toasty-meeting-1-f',
    ],
    certificates: [
      { label: 'Best Speaker — Vikram', seed: 'toasty-cert-1-a' },
      { label: 'Best Evaluator — Priyanka', seed: 'toasty-cert-1-b' },
    ],
  },
  {
    id: 'meeting-past-2',
    dateLabel: 'Thursday, Feb 5',
    theme: 'Voices of Change',
    coverSeed: 'toasty-meeting-2-cover',
    photoSeeds: [
      'toasty-meeting-2-cover',
      'toasty-meeting-2-b',
      'toasty-meeting-2-c',
      'toasty-meeting-2-d',
    ],
    certificates: [
      { label: 'Best Speaker — Dev', seed: 'toasty-cert-2-a' },
      { label: 'Best Table Topics — Simran', seed: 'toasty-cert-2-b' },
    ],
  },
  {
    id: 'meeting-past-3',
    dateLabel: 'Thursday, Jan 29',
    theme: 'Roots & Wings',
    coverSeed: 'toasty-meeting-3-cover',
    photoSeeds: [
      'toasty-meeting-3-cover',
      'toasty-meeting-3-b',
      'toasty-meeting-3-c',
      'toasty-meeting-3-d',
      'toasty-meeting-3-e',
    ],
    certificates: [],
  },
  {
    id: 'meeting-past-4',
    dateLabel: 'Thursday, Jan 22',
    theme: 'Beyond Comfort Zones',
    coverSeed: 'toasty-meeting-4-cover',
    photoSeeds: [
      'toasty-meeting-4-cover',
      'toasty-meeting-4-b',
      'toasty-meeting-4-c',
    ],
    certificates: [{ label: 'Best Evaluator — Rohan', seed: 'toasty-cert-4-a' }],
  },
]
