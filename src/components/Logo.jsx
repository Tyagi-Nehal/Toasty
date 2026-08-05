import { Link } from 'react-router-dom'

export default function Logo({ className = '' }) {
  return (
    <Link
      to="/"
      className={`flex items-center gap-2 font-extrabold text-xl text-ink ${className}`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-cream shadow-sm">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path
            d="M4 10a8 8 0 0 1 16 0v3a8 8 0 0 1-16 0z"
            fill="currentColor"
          />
          <path
            d="M20 11h1a3 3 0 0 1 0 6h-1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </span>
      <span>
        Toast<span className="text-primary">y</span>
      </span>
    </Link>
  )
}
