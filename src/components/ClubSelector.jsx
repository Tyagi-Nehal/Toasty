import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, MapPin, ChevronRight } from 'lucide-react'
import { getApprovedClubs } from '../lib/mockClubRegistry.js'

export default function ClubSelector() {
  const [query, setQuery] = useState('')
  const [selectedClub, setSelectedClub] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const clubs = useMemo(() => getApprovedClubs(), [])

  const filteredClubs = useMemo(() => {
    if (!query.trim()) return clubs
    const q = query.trim().toLowerCase()
    return clubs.filter(
      (club) =>
        club.name.toLowerCase().includes(q) ||
        club.location.toLowerCase().includes(q),
    )
  }, [query, clubs])

  function handleSelect(club) {
    setSelectedClub(club)
    setQuery(club.name)
    setIsOpen(false)
  }

  function handleChange(e) {
    setQuery(e.target.value)
    setSelectedClub(null)
    setIsOpen(true)
  }

  function handleGoToClub() {
    if (!selectedClub) return
    navigate(`/club/${selectedClub.id}`)
  }

  return (
    <div
      id="find-your-club"
      className="scroll-mt-24 rounded-3xl border border-accent/30 bg-white p-6 shadow-lg shadow-primary/5 sm:p-8"
    >
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">
        Find your club
      </h2>
      <p className="mt-2 text-sm text-ink/60 sm:text-base">
        Search for your Toastmasters club to view its page, meetings, and
        more.
      </p>

      <div ref={containerRef} className="relative mt-6">
        <div className="flex items-center gap-2 rounded-xl border border-accent/40 bg-cream px-4 py-3 focus-within:border-primary">
          <Search size={18} className="shrink-0 text-primary" />
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 120)}
            placeholder="e.g. MAHE Bengaluru Toastmasters Club"
            className="w-full bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none sm:text-base"
          />
        </div>

        {isOpen && (
          <ul className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-accent/30 bg-white shadow-xl">
            {filteredClubs.length === 0 && (
              <li className="px-4 py-3 text-sm text-ink/50">
                {clubs.length === 0 ? (
                  <>
                    No clubs have registered yet.{' '}
                    <Link
                      to="/register-club"
                      className="font-semibold text-primary hover:underline"
                    >
                      Register your club
                    </Link>
                    .
                  </>
                ) : (
                  'No clubs found. Try a different search.'
                )}
              </li>
            )}
            {filteredClubs.map((club) => (
              <li key={club.id}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(club)}
                  className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition hover:bg-cream"
                >
                  <span className="text-sm font-medium text-ink">
                    {club.name}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-ink/50">
                    <MapPin size={12} />
                    {club.district && club.area
                      ? `${club.district} · ${club.area}`
                      : club.location}{' '}
                    · {club.members} members
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        disabled={!selectedClub}
        onClick={handleGoToClub}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:text-base"
      >
        Go to Club Page
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
