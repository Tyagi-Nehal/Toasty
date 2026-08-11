// None of this is real club data — no founding year, history, or
// achievement numbers were provided, so this is generic sample content
// clearly flagged with isPlaceholder for the UI to label as such, rather
// than presenting invented facts as if they were real.

const details = {
  'mahe-bengaluru': {
    isPlaceholder: true,
    tagline: `Bengaluru's home for confident public speaking.`,
    founded: null,
    history:
      'This is where the club\'s founding story will go — how it started, who started it, and what it has grown into. Replace this placeholder with the real history once available.',
    achievements: [
      {
        title: 'Distinguished Club',
        year: 'Sample',
        description: 'Placeholder for a real club achievement, e.g. a Toastmasters International distinction or milestone.',
      },
      {
        title: 'Sample Members Milestone',
        year: 'Sample',
        description: 'Placeholder for a real membership milestone.',
      },
    ],
  },
}

const fallback = (club) => ({
  isPlaceholder: true,
  tagline: `Building confident speakers and leaders in ${club.location}.`,
  founded: club.foundedYear ?? null,
  history: `This is where ${club.name}'s founding story will go. Replace this placeholder with the real history once available.`,
  achievements: [
    {
      title: 'Distinguished Club',
      year: 'Sample',
      description: 'Placeholder for a real club achievement.',
    },
    {
      title: `${club.members}+ Members`,
      year: 'Current',
      description: 'A growing, active club community.',
    },
  ],
})

export function getClubDetails(club) {
  return details[club.id] ?? fallback(club)
}
