// The tagline is the only flavor text left here — "Our Story" and
// "Achievements" are now real VPPR-authored content blocks
// (club_content_blocks, see mockPhotoStore.js) instead of static sample
// text, so history/achievements/isPlaceholder were removed once they
// became fully unused.

const details = {
  'mahe-bengaluru': {
    tagline: `Bengaluru's home for confident public speaking.`,
  },
}

const fallback = (club) => ({
  tagline: `Building confident speakers and leaders in ${club.location}.`,
})

export function getClubDetails(club) {
  return details[club.id] ?? fallback(club)
}
