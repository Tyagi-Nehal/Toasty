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

const heroPhotos = [
  { src: heroAudience, alt: 'An engaged audience raising hands during a Toastmasters session', className: 'row-span-2' },
  { src: heroMicrophone, alt: 'A microphone in front of a large speaking audience', className: '' },
  { src: heroDiscussion, alt: 'Toastmasters members chatting after a club meeting', className: '' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream">
      <PublicNavbar showClubLinks />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16 lg:pt-20">
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

            <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
              {stats.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="rounded-2xl bg-white p-3 text-center shadow-sm shadow-primary/5 sm:p-4"
                >
                  <Icon size={20} className="mx-auto text-primary" />
                  <div className="mt-2 text-lg font-bold text-ink sm:text-xl">
                    {value}
                  </div>
                  <div className="text-[11px] leading-tight text-ink/50 sm:text-xs">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4">
            {heroPhotos.map((photo) => (
              <div
                key={photo.src}
                className={`overflow-hidden rounded-3xl shadow-lg shadow-primary/10 ${photo.className}`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Club selection */}
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <ClubSelector />
      </section>

      <Footer />
    </div>
  )
}
