import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  Calendar,
  CalendarDays,
  Clock,
  HeartHandshake,
  LogIn,
  MapPin,
  MapPinned,
  Users,
  X,
} from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar.jsx'
import Footer from '../components/Footer.jsx'
import JoinClubModal from '../components/JoinClubModal.jsx'
import PhotoLightbox from '../components/PhotoLightbox.jsx'
import { getClubById } from '../lib/mockClubRegistry.js'
import { getClubDetails } from '../data/clubDetails.js'
import { dismissMyAcknowledgment, getMyPendingAcknowledgment } from '../lib/mockVisitRequests.js'
import { getClubPagePhotos, getContentBlocks } from '../lib/mockPhotoStore.js'

// Alternating icon-circle tints, cycled through so info tiles/quick
// links don't all look identical — stays within the existing
// primary/accent palette rather than introducing new brand colors.
const TINTS = [
  'bg-primary/15 text-primary',
  'bg-accent/30 text-primary',
  'bg-ink/10 text-ink',
]

// "Our Story" and "Achievements" are both VPPR-authored, repeatable
// photo + title + text blocks — same layout for both, per request.
function ContentBlockSection({ id, title, blocks, emptyMessage, onPhotoClick }) {
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-14 sm:px-6">
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h2>

      {blocks.length === 0 ? (
        <p className="mt-4 text-sm text-ink/50">{emptyMessage}</p>
      ) : (
        <div className="mt-6 space-y-8">
          {blocks.map((block, index) => {
            const photos = block.photoUrls ?? []
            // Alternate sides block by block — first block's photos on
            // the left, text on the right; second block back to text
            // left/photos right; and so on. Only matters at the lg
            // breakpoint where the two sit side by side — mobile always
            // stacks text above photos regardless.
            const flip = photos.length > 0 && index % 2 === 0
            return (
              <div
                key={block.id}
                className="overflow-hidden rounded-3xl border border-accent/30 bg-white shadow-sm shadow-primary/5"
              >
                <div className={`grid gap-0 ${photos.length > 0 ? 'lg:grid-cols-2' : ''}`}>
                  <div className={`flex flex-col justify-center p-8 sm:p-12 ${flip ? 'lg:order-2' : ''}`}>
                    <h3 className="text-xl font-bold text-ink sm:text-2xl">{block.title}</h3>
                    {block.content && (
                      <p className="mt-3 text-sm leading-relaxed text-ink/70 sm:text-base">
                        {block.content}
                      </p>
                    )}
                  </div>
                  {photos.length === 1 && (
                    <div className={`min-h-[300px] ${flip ? 'lg:order-1' : ''}`}>
                      <img
                        src={photos[0].url}
                        alt={block.title}
                        className="h-full w-full cursor-pointer object-cover transition hover:opacity-90"
                        loading="lazy"
                        onClick={() => onPhotoClick(photos[0].url)}
                      />
                    </div>
                  )}
                  {photos.length > 1 && (
                    <div className={`grid min-h-[300px] grid-cols-2 gap-2 bg-cream p-2 ${flip ? 'lg:order-1' : ''}`}>
                      {photos.map((photo) => (
                        <img
                          key={photo.id}
                          src={photo.url}
                          alt={block.title}
                          className="h-full w-full cursor-pointer rounded-xl object-cover transition hover:opacity-90"
                          loading="lazy"
                          onClick={() => onPhotoClick(photo.url)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default function ClubHomePage() {
  const { clubId } = useParams()
  const location = useLocation()
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [ackBanner, setAckBanner] = useState(null)
  // undefined = still loading, null = confirmed not found, object = found
  const [club, setClub] = useState(undefined)
  const [heroPhotos, setHeroPhotos] = useState([])
  const [storyBlocks, setStoryBlocks] = useState([])
  const [achievementBlocks, setAchievementBlocks] = useState([])
  const [lightboxUrl, setLightboxUrl] = useState(null)

  useEffect(() => {
    setClub(undefined)
    getClubById(clubId).then(setClub)
  }, [clubId])

  useEffect(() => {
    setAckBanner(getMyPendingAcknowledgment())
  }, [])

  useEffect(() => {
    getClubPagePhotos('hero').then(setHeroPhotos)
    getContentBlocks('story').then(setStoryBlocks)
    getContentBlocks('achievements').then(setAchievementBlocks)
  }, [])

  // React Router doesn't scroll to the URL hash on its own (that's a native
  // full-page-load behavior), and the sections it targets render async
  // (club fetch + content blocks) — so re-run this once everything the
  // hash could point at has actually mounted, not just on first paint.
  useEffect(() => {
    if (!location.hash || !club) return
    const el = document.querySelector(location.hash)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash, club, storyBlocks, achievementBlocks])

  function dismissBanner() {
    dismissMyAcknowledgment()
    setAckBanner(null)
  }

  if (club === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-sm text-ink/50">Loading club...</p>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-4 text-center">
        <h1 className="text-2xl font-bold text-ink">Club not found</h1>
        <p className="max-w-sm text-sm text-ink/60">
          We couldn't find a club with that name. Try searching again from
          the home page.
        </p>
        <Link
          to="/"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
        >
          Back to home
        </Link>
      </div>
    )
  }

  // Only the tagline (flavor text) comes from clubDetails.js — every
  // factual field (location, founded year, member count, meeting info)
  // renders straight from the real registered `club` record so it
  // always matches what the president actually submitted.
  const details = getClubDetails(club)
  const [heroPhoto, ...extraHeroPhotos] = heroPhotos

  // Real ExCom contact info for this specific club — not shown on other
  // clubs' pages, since a President/VPM's contact details are specific
  // to their own club, not universal to every club Toasty might serve.
  const clubContacts =
    club.id === 'mahe-bengaluru-toastmasters-club'
      ? {
          president: { name: 'Sarvajit Srivatsa', email: 'sarvajit607@gmail.com' },
          vpm: { name: 'Navaankur Deka', email: 'nick@gmail.com' },
        }
      : null

  const infoTiles = [
    { icon: MapPin, label: 'Location', value: club.location },
    club.foundedYear && { icon: CalendarDays, label: 'Founded', value: club.foundedYear },
    { icon: Users, label: 'Members', value: club.members },
    club.meetingDay && { icon: Calendar, label: 'Meets', value: club.meetingDay },
    club.meetingTime && { icon: Clock, label: 'Time', value: club.meetingTime },
    club.meetingLocation && { icon: MapPinned, label: 'Venue', value: club.meetingLocation },
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-cream">
      <PublicNavbar showMemberPageLinks />

      {ackBanner && (
        <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between gap-3 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary sm:px-6">
          <span>The VPM acknowledged your visit request.</span>
          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Dismiss"
            className="shrink-0 rounded-full p-1 transition hover:bg-primary/10"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Hero — full-bleed photo if the VPPR has uploaded one, otherwise a
          branded gradient so it never looks empty. */}
      <section className="relative overflow-hidden">
        {heroPhoto ? (
          <div className="absolute inset-0">
            <img src={heroPhoto.url} alt="" className="h-full w-full object-cover object-[50%_45%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/55 to-ink/25" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark" />
        )}

        <div className="relative mx-auto max-w-6xl px-4 pt-32 pb-32 sm:px-6 sm:pt-36 sm:pb-36">
          <span className="inline-flex items-center gap-2 rounded-full bg-cream/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-cream backdrop-blur-sm">
            Toastmasters Club
          </span>
          <h1 className="mt-4 max-w-3xl text-3xl font-extrabold leading-tight text-cream sm:text-5xl">
            {club.name}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-cream/80 sm:text-lg">
            {details.tagline}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-full bg-cream px-6 py-3 text-sm font-semibold text-primary shadow-md shadow-ink/10 transition hover:bg-white"
            >
              <LogIn size={18} />
              Login
            </Link>
            <button
              type="button"
              onClick={() => setIsJoinOpen(true)}
              className="flex items-center gap-2 rounded-full border border-cream/60 px-6 py-3 text-sm font-semibold text-cream transition hover:bg-cream/10"
            >
              <HeartHandshake size={18} />
              I'm interested in visiting
            </button>
          </div>

          {extraHeroPhotos.length > 0 && (
            <div className="mt-8 flex gap-3 overflow-x-auto">
              {extraHeroPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-video w-40 shrink-0 overflow-hidden rounded-2xl shadow-md shadow-ink/20"
                >
                  <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Floating info card, overlapping the hero's bottom edge */}
      <div className="relative z-10 mx-auto -mt-14 max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 rounded-3xl bg-white p-5 shadow-xl shadow-ink/10 sm:grid-cols-3 sm:p-6 lg:grid-cols-6">
          {infoTiles.map((tile, i) => (
            <div key={tile.label} className="flex flex-col items-center gap-2 text-center">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${TINTS[i % TINTS.length]}`}>
                <tile.icon size={19} />
              </span>
              <div>
                <p className="text-xs font-medium text-ink/40">{tile.label}</p>
                <p className="text-sm font-semibold text-ink">{tile.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-16 pb-6">
        <ContentBlockSection
          id="our-story"
          title="Our Story"
          blocks={storyBlocks}
          emptyMessage="The club's story hasn't been added yet."
          onPhotoClick={setLightboxUrl}
        />

        <ContentBlockSection
          id="achievements"
          title="Achievements"
          blocks={achievementBlocks}
          emptyMessage="No achievements added yet."
          onPhotoClick={setLightboxUrl}
        />
      </div>

      <Footer clubContacts={clubContacts} />

      {isJoinOpen && (
        <JoinClubModal club={club} onClose={() => setIsJoinOpen(false)} />
      )}

      <PhotoLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  )
}
