import {
  CalendarDays,
  Globe2,
  MessageSquare,
  Mic2,
  Sparkles,
  TrendingUp,
  Trophy,
  UserCog,
  Users,
} from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar.jsx'
import Footer from '../components/Footer.jsx'
import ClubSelector from '../components/ClubSelector.jsx'
import heroStrip1 from '../assets/landing/hero-strip-1-empowerment.jpg'
import heroStrip2 from '../assets/landing/hero-strip-2-handshake.jpg'
import heroStrip3 from '../assets/landing/hero-strip-3-celebration.jpg'
import heroStrip4 from '../assets/landing/hero-strip-4-speaker.jpg'

const heroPhotos = [
  { src: heroStrip1, alt: 'A silhouette raising a fist against a sunset sky' },
  { src: heroStrip2, alt: 'Colleagues greeting each other with a handshake' },
  { src: heroStrip3, alt: 'Two colleagues hugging and celebrating' },
  { src: heroStrip4, alt: 'A speaker addressing an audience on stage' },
]

const stats = [
  { icon: Users, label: 'Members worldwide', value: '265,000+' },
  { icon: Globe2, label: 'Clubs across the globe', value: '13,800+' },
  { icon: Sparkles, label: 'Countries & territories', value: 'Nearly 150' },
]

const features = [
  {
    icon: Mic2,
    title: 'Structured Speeches',
    description:
      'Work through a real speech path — from your first prepared talk to advanced projects — with a clear next step every time.',
  },
  {
    icon: UserCog,
    title: 'Leadership Roles',
    description:
      'Every meeting runs on member-filled roles — Toastmaster, Evaluator, Timer, Table Topics Master — real practice running a room.',
  },
  {
    icon: MessageSquare,
    title: 'Supportive Feedback',
    description:
      'Every speech gets specific, encouraging feedback from fellow members — built to help you improve, not to judge you.',
  },
]

const gridItems = [
  { icon: CalendarDays, label: 'Weekly Practice', tone: 'bg-primary' },
  { icon: MessageSquare, label: 'Real Feedback', tone: 'bg-ink' },
  { icon: UserCog, label: 'Leadership Roles', tone: 'bg-primary-dark' },
  { icon: Mic2, label: 'Public Speaking', tone: 'bg-primary' },
  { icon: Globe2, label: 'Global Network', tone: 'bg-ink' },
  { icon: TrendingUp, label: 'Structured Growth', tone: 'bg-primary-dark' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <PublicNavbar showClubLinks />

      {/* Hero — 4 vertical photos adjacent to each other as the full
          background, faded toward cream (their own colors, just muted)
          instead of tinted a solid color. */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-4">
          {heroPhotos.map((photo) => (
            <div key={photo.src} className="h-full w-full">
              <img
                src={photo.src}
                alt={photo.alt}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-cream/30" />

        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-32 text-center sm:px-6 sm:pt-16 sm:pb-40 lg:pt-20">
          {/* Everything sits on one solid card instead of loose text
              directly on the photos — the paragraph especially had no
              backing of its own and disappeared against lighter parts
              of the photos behind it. */}
          <div className="mx-auto max-w-2xl rounded-[2rem] bg-white/90 p-6 shadow-xl shadow-ink/10 backdrop-blur sm:p-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              Toastmasters International
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
              Where leaders <span className="text-primary">are made.</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink/70 sm:text-lg">
              Since 1924, Toastmasters International has helped people become
              more confident public speakers and leaders through a
              worldwide network of member-run clubs. Every meeting is a
              safe, supportive space to practice communication and
              leadership skills.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href="#find-club"
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-cream shadow-lg shadow-primary/30 transition hover:bg-primary-dark"
              >
                Find Your Club
              </a>
              <a
                href="#why-join"
                className="rounded-full border border-primary/50 px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                Learn More
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-primary/5 p-4 text-left">
              <Trophy size={28} className="shrink-0 text-primary" />
              <p className="text-sm text-ink/70">
                Each year, thousands of members compete for the title of{' '}
                <span className="font-semibold text-ink">
                  World Champion of Public Speaking
                </span>{' '}
                — Toastmasters' most prestigious honor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature cards — float up over the hero's bottom edge. */}
      <div className="relative z-10 mx-auto -mt-20 max-w-6xl px-4 sm:-mt-24 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-3xl bg-white p-6 shadow-xl shadow-ink/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon size={22} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <section className="mt-16 border-y border-accent/20 bg-white sm:mt-20">
        <div className="mx-auto grid max-w-4xl grid-cols-3 divide-x divide-accent/15 px-4 py-10 sm:px-6">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-2 px-2 text-center">
              <Icon size={22} className="text-primary" />
              <div className="text-2xl font-extrabold text-ink sm:text-3xl">{value}</div>
              <div className="text-xs text-ink/60 sm:text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why join — colored icon grid */}
      <section id="why-join" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              Why Join
            </span>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
              Built around real practice, not a lecture.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink/70">
              Every meeting is hands-on — structured roles, real speeches, and
              feedback that actually helps you grow, in a room full of people
              rooting for you.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {gridItems.map(({ icon: Icon, label, tone }) => (
              <div key={label} className={`rounded-2xl p-5 text-center ${tone}`}>
                <Icon size={22} className="mx-auto text-white" />
                <p className="mt-2 text-xs font-semibold text-white sm:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Club selection */}
      <section id="find-club" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
        <ClubSelector />
      </section>

      <Footer />
    </div>
  )
}
