import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import GoogleButton from '../components/GoogleButton.jsx'
import PendingApprovalNotice from '../components/PendingApprovalNotice.jsx'
import { useAuth } from '../lib/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { isFounderEmail } from '../lib/mockFounderAuth.js'
import { EXCOM_ROLES } from '../lib/mockExcomRegistry.js'

const inputClass =
  'w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none'

export default function SignUpPage() {
  const [fullName, setFullName] = useState('')
  const [appliedForExcom, setAppliedForExcom] = useState(false)
  const [requestedRole, setRequestedRole] = useState(EXCOM_ROLES[0])
  const [error, setError] = useState(null)
  const { account } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isFounderEmail(account?.email)) {
      navigate('/founder-login')
    } else if (account?.status === 'approved') {
      navigate('/dashboard')
    }
  }, [account, navigate])

  // The typed name (not whatever name Google has on file) and, if
  // applying for ExCom, the chosen role are stashed in sessionStorage
  // right before the OAuth redirect — the page fully unloads for the
  // Google round trip, so this is the only way to carry them across to
  // mockAuth.js's syncAccountFromSupabaseUser, which reads and clears
  // them exactly once when the session comes back.
  function handleGoogleSignUp() {
    if (!fullName.trim()) {
      setError('Enter your full name first.')
      return
    }
    setError(null)
    sessionStorage.setItem('toasty_signup_name', fullName.trim())
    if (appliedForExcom) {
      sessionStorage.setItem('toasty_applied_for_excom', 'true')
      sessionStorage.setItem('toasty_requested_excom_role', requestedRole)
    }
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/signup',
        queryParams: { prompt: 'select_account' },
      },
    })
  }

  return (
    <AuthLayout>
      {account?.status === 'pending' && !isFounderEmail(account?.email) ? (
        <PendingApprovalNotice email={account.email} />
      ) : (
        <>
          <h1 className="text-xl font-bold text-ink sm:text-2xl">
            Create your Toasty account
          </h1>
          <p className="mt-1.5 text-sm text-ink/60">
            Enter your name, then continue with your college Google account
            to verify it's really you and join your club on Toasty.
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink/60">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className={inputClass}
              />
            </div>

            <label className="flex items-start gap-2.5 rounded-xl border border-accent/30 bg-cream px-4 py-3 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={appliedForExcom}
                onChange={(e) => setAppliedForExcom(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              I'm applying for an ExCom position
            </label>

            {appliedForExcom && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink/60">
                  Which role?
                </label>
                <select
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value)}
                  className={inputClass}
                >
                  {EXCOM_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <GoogleButton onClick={handleGoogleSignUp}>Continue with Google</GoogleButton>

            {error && <p className="text-sm font-medium text-red-700">{error}</p>}
          </div>

          <p className="mt-4 text-center text-xs text-ink/40">
            {appliedForExcom
              ? "Your ExCom application is reviewed by the President."
              : 'Your request is reviewed by the VPM.'}
          </p>

          <p className="mt-6 text-center text-sm text-ink/60">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  )
}
