import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Building,
  Calendar,
  Check,
  Hash,
  Inbox,
  Mail,
  MapPinned,
  Phone,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar.jsx'
import Footer from '../components/Footer.jsx'
import { isFounder } from '../lib/mockFounderAuth.js'
import {
  approveClub,
  approvePresident,
  getPendingClubs,
  getPendingPresidents,
  rejectClub,
  rejectPresident,
} from '../lib/mockClubRegistry.js'

const clubDetailFields = [
  { key: 'presidentName', label: 'President', icon: User },
  { key: 'clubId', label: 'Club ID', icon: Hash },
  { key: 'district', label: 'District', icon: Building },
  { key: 'area', label: 'Area', icon: MapPinned },
  { key: 'members', label: 'Members', icon: Users },
  { key: 'foundedYear', label: 'Founded', icon: Calendar },
]

const presidentDetailFields = [
  { key: 'memberId', label: 'Member ID', icon: Hash },
  { key: 'clubName', label: 'Club', icon: Building },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'phone', label: 'Phone', icon: Phone },
]

export default function ClubReviewPage() {
  const [pendingClubs, setPendingClubs] = useState(() => getPendingClubs())
  const [pendingPresidents, setPendingPresidents] = useState(() => getPendingPresidents())

  if (!isFounder()) {
    return <Navigate to="/founder-login" replace />
  }

  function handleApproveClub(id) {
    approveClub(id)
    setPendingClubs(getPendingClubs())
  }

  function handleRejectClub(id) {
    rejectClub(id)
    setPendingClubs(getPendingClubs())
  }

  function handleApprovePresident(id) {
    approvePresident(id)
    setPendingPresidents(getPendingPresidents())
  }

  function handleRejectPresident(id) {
    rejectPresident(id)
    setPendingPresidents(getPendingPresidents())
  }

  return (
    <div className="min-h-screen bg-cream">
      <PublicNavbar />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {/* President verifications */}
        <div className="flex items-center gap-2">
          <ShieldCheck size={22} className="text-primary" />
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            President Verifications
          </h1>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          Pending president verification requests. Approving one lets that
          email submit a club registration.
        </p>

        {pendingPresidents.length > 0 ? (
          <div className="mt-7 space-y-4">
            {pendingPresidents.map((president) => (
              <div
                key={president.id}
                className="rounded-3xl border border-accent/30 bg-white p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="text-lg font-bold text-ink">{president.name}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRejectPresident(president.id)}
                      className="flex items-center gap-1.5 rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:bg-cream"
                    >
                      <X size={15} />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprovePresident(president.id)}
                      className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
                    >
                      <Check size={15} />
                      Approve
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-accent/20 pt-4 sm:grid-cols-4">
                  {presidentDetailFields.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center gap-1.5 text-sm text-ink/70">
                      <Icon size={13} className="shrink-0 text-primary" />
                      <span className="truncate">
                        {label}: {president[key]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-7 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-accent/40 bg-white p-8 text-center">
            <Inbox size={24} className="text-ink/30" />
            <p className="text-sm text-ink/50">No pending president verifications.</p>
          </div>
        )}

        {/* Club registrations */}
        <div className="mt-12 flex items-center gap-2">
          <ShieldCheck size={22} className="text-primary" />
          <h2 className="text-2xl font-extrabold text-ink sm:text-3xl">
            Club Registrations
          </h2>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          Pending club submissions awaiting review.
        </p>

        {pendingClubs.length > 0 ? (
          <div className="mt-7 space-y-4">
            {pendingClubs.map((club) => (
              <div
                key={club.id}
                className="rounded-3xl border border-accent/30 bg-white p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-ink">{club.name}</p>
                    <p className="text-sm text-ink/60">
                      {club.city}, {club.country}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleRejectClub(club.id)}
                      className="flex items-center gap-1.5 rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:bg-cream"
                    >
                      <X size={15} />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveClub(club.id)}
                      className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
                    >
                      <Check size={15} />
                      Approve
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-accent/20 pt-4 sm:grid-cols-3">
                  {clubDetailFields.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center gap-1.5 text-sm text-ink/70">
                      <Icon size={13} className="shrink-0 text-primary" />
                      <span className="truncate">
                        {label}: {club[key]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-7 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-accent/40 bg-white p-8 text-center">
            <Inbox size={24} className="text-ink/30" />
            <p className="text-sm text-ink/50">No pending club registrations.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
