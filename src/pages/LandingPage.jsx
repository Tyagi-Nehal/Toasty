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
import heroMicrophone from '../assets/landing/hero-microphone-audience.jpg'

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

      {/* Hero — angled photo background with a dark gradient overlay,
          instead of a light cream section. */}
      <section className="relative overflow-hidden bg-ink">
        <div className="absolute inset-0">
          <img
            src={heroMicrophone}
            alt="A Toastmasters speaker addressing a large audience"
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-br from-ink via-ink/90 to-primary-dark/70"
            style={{ clipPath: 'polygon(0 0, 68% 0, 42% 100%, 0 100%)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-ink/10 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-32 sm:px-6 sm:pt-16 sm:pb-40 lg:pt-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-cream backdrop-blur">
              Toastmasters International
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
              Where leaders <span className="text-accent">are made.</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/75 sm:text-lg">
              Since 1924, Toastmasters International has helped people become
              more confident public speakers and leaders through a
              worldwide network of member-run clubs. Every meeting is a
              safe, supportive space to practice communication and
              leadership skills.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#find-club"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink shadow-lg shadow-ink/20 transition hover:bg-cream"
              >
                Find Your Club
              </a>
              <a
                href="#why-join"
                className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Learn More
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
              <Trophy size={28} className="shrink-0 text-accent" />
              <p className="text-sm text-white/80">
                Each year, thousands of members compete for the title of{' '}
                <span className="font-semibold text-white">
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
