import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import AuthLayout from '../components/AuthLayout.jsx'
import { setFounder } from '../lib/mockFounderAuth.js'

export default function FounderLoginPage() {
  const navigate = useNavigate()

  function handleContinue() {
    setFounder(true)
    navigate('/club-review')
  }

  return (
    <AuthLayout>
      <div className="flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 text-primary">
          <ShieldCheck size={22} />
        </div>
      </div>
      <h1 className="mt-4 text-center text-xl font-bold text-ink sm:text-2xl">
        Founder Access
      </h1>
      <p className="mt-1.5 text-center text-sm text-ink/60">
        Reserved for the Toasty team (Isha &amp; Nehal) to review new club
        registrations.
      </p>

      <button
        type="button"
        onClick={handleContinue}
        className="mt-6 w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
      >
        Continue as Founder
      </button>
      <p className="mt-3 text-center text-xs text-ink/40">
        Prototype only — no real authentication yet.
      </p>
    </AuthLayout>
  )
}
