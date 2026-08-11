import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Award,
  Calendar,
  CalendarDays,
  ChevronRight,
  Clock,
  HeartHandshake,
  History,
  LogIn,
  MapPin,
  MapPinned,
  Users,
  UsersRound,
  X,
} from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar.jsx'
import Footer from '../components/Footer.jsx'
import JoinClubModal from '../components/JoinClubModal.jsx'
import { getClubById } from '../lib/mockClubRegistry.js'
import { getClubDetails } from '../data/clubDetails.js'
import { dismissMyAcknowledgment, getMyPendingAcknowledgment } from '../lib/mockVisitRequests.js'
import { getClubPagePhotos } from '../lib/mockPhotoStore.js'

const EMPTY_SECTIONS = { hero: [], gallery: [], story: [], achievements: [] }

// Alternating icon-circle tints, cycled through so info tiles/achievement
// icons/quick links don't all look identical — stays within the existing
// primary/accent palette rather than introducing new brand colors.
const TINTS = [
  'bg-primary/15 text-primary',
  'bg-accent/30 text-primary',
  'bg-ink/10 text-ink',
]

export default function ClubHomePage() {
  const { clubId } = useParams()
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [ackBanner, setAckBanner] = useState(null)
  // undefined = still loading, null = confirmed not found, object = found
  const [club, setClub] = useState(undefined)
  const [sectionPhotos, setSectionPhotos] = useState(EMPTY_SECTIONS)

  useEffect(() => {
    setClub(undefined)
    getClubById(clubId).then(setClub)
  }, [clubId])

  useEffect(() => {
    setAckBanner(getMyPendingAcknowledgment())
  }, [])

  useEffect(() => {
    getClubPagePhotos().then((photos) => {
      setSectionPhotos({
        hero: photos.filter((p) => p.section === 'hero'),
        gallery: photos.filter((p) => p.section === 'gallery'),
        story: photos.filter((p) => p.section === 'story'),
        achievements: photos.filter((p) => p.section === 'achievements'),
      })
    })
  }, [])

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

  // Only flavor text (tagline/history/achievements/photos) comes from
  // clubDetails.js — every factual field (location, founded year, member
  // count, meeting info) renders straight from the real registered `club`
  // record so it always matches what the president actually submitted.
  const details = getClubDetails(club)
  const [heroPhoto, ...extraHeroPhotos] = sectionPhotos.hero

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
      <PublicNavbar />

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
            <img src={heroPhoto.url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/55 to-ink/25" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark" />
        )}

        <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-24 sm:px-6 sm:pt-20 sm:pb-28">
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

      {/* Photo gallery */}
      {sectionPhotos.gallery.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14 pt-16 sm:px-6">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">Gallery</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {sectionPhotos.gallery.map((photo, i) => (
              <div
                key={photo.id}
                className={`overflow-hidden rounded-2xl shadow-sm shadow-primary/10 ${
                  i === 0 ? 'col-span-2 row-span-2 sm:col-span-1' : ''
                }`}
              >
                <img
                  src={photo.url}
                  alt={`${club.name} meeting photo`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* History */}
      <section className={`mx-auto max-w-6xl px-4 pb-14 sm:px-6 ${sectionPhotos.gallery.length > 0 ? '' : 'pt-16'}`}>
        <div className="overflow-hidden rounded-3xl border border-accent/30 bg-white shadow-sm shadow-primary/5">
          <div className={`grid gap-0 ${sectionPhotos.story.length > 0 ? 'lg:grid-cols-2' : ''}`}>
            <div className="p-6 sm:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold text-ink sm:text-3xl">Our Story</h2>
                {details.isPlaceholder && (
                  <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-primary">
                    Sample content — replace with the real story
                  </span>
                )}
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink/70 sm:text-base">
                {details.history}
              </p>

              {sectionPhotos.story.length > 1 && (
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {sectionPhotos.story.slice(1).map((photo) => (
                    <div key={photo.id} className="aspect-square overflow-hidden rounded-2xl">
                      <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {sectionPhotos.story.length > 0 && (
              <div className="min-h-[220px]">
                <img
                  src={sectionPhotos.story[0].url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">Achievements</h2>
          {details.isPlaceholder && (
            <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-primary">
              Sample content — replace with real achievements
            </span>
          )}
        </div>
        {sectionPhotos.achievements.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sectionPhotos.achievements.map((photo) => (
              <div key={photo.id} className="aspect-square overflow-hidden rounded-2xl">
                <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {details.achievements.map((achievement, i) => (
            <div
              key={achievement.title}
              className="rounded-2xl bg-white p-5 shadow-sm shadow-primary/5"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${TINTS[i % TINTS.length]}`}>
                <Award size={20} />
              </div>
              <h3 className="mt-3 font-semibold text-ink">{achievement.title}</h3>
              <span className="text-xs font-medium text-primary">
                {achievement.year}
              </span>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">
                {achievement.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mentors / ExCom / Past ExCom — standalone pages, linked rather than inlined */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { to: '/mentors', label: 'Meet Our Mentors', icon: UsersRound },
            { to: '/excom', label: 'Meet Our ExCom', icon: UsersRound },
            { to: '/past-excom', label: 'Meet Our Past ExCom', icon: History },
          ].map(({ to, label, icon: Icon }, i) => (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-white p-5 transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
            >
              <span className="flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${TINTS[i % TINTS.length]}`}>
                  <Icon size={20} />
                </span>
                <span className="font-semibold text-ink">{label}</span>
              </span>
              <ChevronRight size={18} className="text-primary" />
            </Link>
          ))}
        </div>
      </section>

      <Footer />

      {isJoinOpen && (
        <JoinClubModal club={club} onClose={() => setIsJoinOpen(false)} />
      )}
    </div>
  )
}
