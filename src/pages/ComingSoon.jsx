import { Link } from 'react-router-dom'
import { Hammer } from 'lucide-react'

export default function ComingSoon({ label = 'This page' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20 text-primary">
        <Hammer size={28} />
      </div>
      <h1 className="text-2xl font-bold text-ink">{label} is under construction</h1>
      <p className="max-w-sm text-sm text-ink/60">
        We're building Toasty page by page. This one isn't ready yet.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
      >
        Back to home
      </Link>
    </div>
  )
}
