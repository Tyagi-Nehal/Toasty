import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

const memberPageLinks = [
  { to: '/mentors', label: 'Meet Our Mentors' },
  { to: '/excom', label: 'Meet Our ExCom' },
  { to: '/past-excom', label: 'Meet Our Past ExCom' },
]

// "Register your Club" only makes sense on the landing page itself —
// every other public page (Club Home, Register Club, Register
// President, Club Review) reuses this navbar but hides it via
// showClubLinks. (A "Find your club" nav link used to sit next to it,
// but it pointed at a mismatched anchor id and duplicated the hero's
// own "Find Your Club" button, so it's gone rather than fixed.)
// showMemberPageLinks is Club Home-only — these pages require a
// signed-in member (same redirect-to-login behavior as before, just
// relocated from cards at the bottom of the page).
export default function PublicNavbar({ showClubLinks = false, showMemberPageLinks = false }) {
  return (
    <header className="sticky top-0 z-40 border-b border-accent/30 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />
        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 sm:gap-x-5">
          {showMemberPageLinks && (
            <>
              <a
                href="#our-story"
                className="text-sm font-medium text-ink/70 transition hover:text-primary"
              >
                Our Story
              </a>
              <a
                href="#achievements"
                className="text-sm font-medium text-ink/70 transition hover:text-primary"
              >
                Achievements
              </a>
              {memberPageLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm font-medium text-ink/70 transition hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </>
          )}
          {showClubLinks && (
            <Link
              to="/register-club"
              className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-cream"
            >
              Register your Club
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
