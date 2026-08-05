import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  MapPin,
  CalendarDays,
  Users,
  Award,
  ChevronRight,
  LogIn,
  HeartHandshake,
} from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar.jsx'
import Footer from '../components/Footer.jsx'
import JoinClubModal from '../components/JoinClubModal.jsx'
import Avatar from '../components/Avatar.jsx'
import { getClubById } from '../lib/mockClubRegistry.js'
import { getClubDetails } from '../data/clubDetails.js'
import { mentors } from '../data/mentors.js'
import { pastExcom } from '../data/excom.js'

export default function ClubHomePage() {
  const { clubId } = useParams()
  const [isJoinOpen, setIsJoinOpen] = useState(false)

  const club = getClubById(clubId)

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

  const details = getClubDetails(club)
  // Mentors and Past ExCom are still a single global dataset scoped to the
  // one real club (mahe-bengaluru) — until every club gets its own roster,
  // other clubs must NOT show these real people as if they led/mentor them.
  const isRealClub = club.id === 'mahe-bengaluru'
  const mentorPreview = isRealClub ? mentors.slice(0, 3) : []
  const excomPreview = isRealClub ? pastExcom.slice(0, 4) : []

  return (
    <div className="min-h-screen bg-cream">
      <PublicNavbar />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:px-6 sm:pt-16">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
          Toastmasters Club
        </span>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-ink sm:text-5xl">
          {club.name}
        </h1>
        <p className="mt-3 max-w-2xl text-base text-ink/70 sm:text-lg">
          {details.tagline}
        </p>

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-ink/60">
          <span className="flex items-center gap-1.5">
            <MapPin size={16} className="text-primary" />
            {club.location}
          </span>
          {details.founded && (
            <span className="flex items-center gap-1.5">
              <CalendarDays size={16} className="text-primary" />
              Founded {details.founded}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users size={16} className="text-primary" />
            {club.members} members
          </span>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/login"
            className="flex items-center gap-2 rounded-full border border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-cream"
          >
            <LogIn size={18} />
            Login
          </Link>
          <button
            type="button"
            onClick={() => setIsJoinOpen(true)}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
          >
            <HeartHandshake size={18} />
            I'm interested in joining
          </button>
        </div>
      </section>

      {/* Photo gallery */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {details.photoSeeds.map((seed, i) => (
            <div
              key={seed}
              className={`overflow-hidden rounded-2xl shadow-sm shadow-primary/10 ${
                i === 0 ? 'col-span-2 row-span-2 sm:col-span-1' : ''
              }`}
            >
              <img
                src={`https://picsum.photos/seed/${seed}/400/400`}
                alt={`${club.name} meeting photo`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </section>

      {/* History */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="rounded-3xl border border-accent/30 bg-white p-6 sm:p-10">
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
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {details.achievements.map((achievement) => (
            <div
              key={achievement.title}
              className="rounded-2xl bg-white p-5 shadow-sm shadow-primary/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-primary">
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

      {/* Mentor preview */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">
            Meet Our Mentors
          </h2>
          <Link
            to="/mentors"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View all
            <ChevronRight size={16} />
          </Link>
        </div>
        {mentorPreview.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {mentorPreview.map((mentor) => (
              <div
                key={mentor.id}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm shadow-primary/5"
              >
                <Avatar name={mentor.name} size={48} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{mentor.name}</p>
                  <p className="truncate text-xs text-ink/60">{mentor.designation}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-accent/40 bg-white p-6 text-center text-sm text-ink/50">
            No mentors added yet.
          </div>
        )}
      </section>

      {/* Past ExCom preview */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">Past ExCom</h2>
          <Link
            to="/past-excom"
            className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            View all
            <ChevronRight size={16} />
          </Link>
        </div>
        {excomPreview.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {excomPreview.map((member) => (
              <div
                key={member.id}
                className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center shadow-sm shadow-primary/5"
              >
                <Avatar name={member.name} size={56} />
                <div>
                  <p className="font-semibold text-ink">{member.name}</p>
                  <p className="text-xs text-ink/60">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-accent/40 bg-white p-6 text-center text-sm text-ink/50">
            No past ExCom on record yet.
          </div>
        )}
      </section>

      <Footer />

      {isJoinOpen && (
        <JoinClubModal
          clubName={club.name}
          onClose={() => setIsJoinOpen(false)}
        />
      )}
    </div>
  )
}
