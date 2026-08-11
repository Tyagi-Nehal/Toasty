import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

const memberPageLinks = [
  { to: '/mentors', label: 'Meet Our Mentors' },
  { to: '/excom', label: 'Meet Our ExCom' },
  { to: '/past-excom', label: 'Meet Our Past ExCom' },
]

// "Find your club" and "Register your Club" only make sense on the
// landing page itself — every other public page (Club Home, Register
// Club, Register President, Club Review) reuses this navbar but hides
// them via showClubLinks. showMemberPageLinks is Club Home-only — these
// pages require a signed-in member (same redirect-to-login behavior as
// before, just relocated from cards at the bottom of the page).
export default function PublicNavbar({ showClubLinks = false, showMemberPageLinks = false }) {
  return (
    <header className="sticky top-0 z-40 border-b border-accent/30 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />
        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 sm:gap-x-5">
          {showMemberPageLinks &&
            memberPageLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-ink/70 transition hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          {showClubLinks && (
            <>
              <a
                href="#find-your-club"
                className="hidden text-sm font-medium text-ink/70 transition hover:text-primary sm:block"
              >
                Find your club
              </a>
              <Link
                to="/register-club"
                className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-cream"
              >
                Register your Club
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
