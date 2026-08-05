import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

export default function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-accent/30 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-4">
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
        </nav>
      </div>
    </header>
  )
}
