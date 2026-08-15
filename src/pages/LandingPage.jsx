import { Trophy, Globe2, Users, Sparkles } from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar.jsx'
import Footer from '../components/Footer.jsx'
import ClubSelector from '../components/ClubSelector.jsx'
import heroAudience from '../assets/landing/hero-audience-handsup.jpg'
import heroDiscussion from '../assets/landing/hero-group-discussion.jpg'
import heroMicrophone from '../assets/landing/hero-microphone-audience.jpg'

const stats = [
  { icon: Users, label: 'Members worldwide', value: '265,000+' },
  { icon: Globe2, label: 'Clubs across the globe', value: '13,800+' },
  { icon: Sparkles, label: 'Countries & territories', value: 'Nearly 150' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <PublicNavbar showClubLinks />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-24 sm:px-6 sm:pt-16 sm:pb-28 lg:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
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

            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/30 bg-white p-4">
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

          {/* Photo cluster — one large image with two smaller ones
              fanned out below it, on a soft color blob, instead of a
              rigid grid. */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -right-8 -top-8 h-64 w-64 rounded-full bg-accent/30 blur-3xl sm:h-80 sm:w-80"
            />
            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] shadow-xl shadow-primary/15">
                <img
                  src={heroAudience}
                  alt="An engaged audience raising hands during a Toastmasters session"
                  className="h-[320px] w-full object-cover sm:h-[400px]"
                  loading="lazy"
                />
              </div>
              <div className="absolute -bottom-10 -left-4 flex gap-3 sm:-left-8 sm:gap-4">
                <div className="w-28 overflow-hidden rounded-2xl border-4 border-cream shadow-xl shadow-primary/20 sm:w-36">
                  <img
                    src={heroMicrophone}
                    alt="A microphone in front of a large speaking audience"
                    className="h-24 w-full object-cover sm:h-32"
                    loading="lazy"
                  />
                </div>
                <div className="mt-6 w-28 overflow-hidden rounded-2xl border-4 border-cream shadow-xl shadow-primary/20 sm:mt-8 sm:w-36">
                  <img
                    src={heroDiscussion}
                    alt="Toastmasters members chatting after a club meeting"
                    className="h-24 w-full object-cover sm:h-32"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats — a full-width band of its own instead of squeezed into
          the hero's text column. */}
      <section className="border-y border-accent/20 bg-white">
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

      {/* Club selection */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <ClubSelector />
      </section>

      <Footer />
    </div>
  )
}
