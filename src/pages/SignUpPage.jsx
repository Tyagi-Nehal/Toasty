import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import GoogleButton from '../components/GoogleButton.jsx'
import PendingApprovalNotice from '../components/PendingApprovalNotice.jsx'
import { useAuth } from '../lib/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { isFounderEmail } from '../lib/mockFounderAuth.js'

export default function SignUpPage() {
  const [appliedForExcom, setAppliedForExcom] = useState(false)
  const { account } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isFounderEmail(account?.email)) {
      navigate('/founder-login')
    } else if (account?.status === 'approved') {
      navigate('/dashboard')
    }
  }, [account, navigate])

  function handleGoogleSignUp() {
    if (appliedForExcom) sessionStorage.setItem('toasty_applied_for_excom', 'true')
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/signup' },
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
            Sign up with your college Google account to join your club on
            Toasty.
          </p>

          <div className="mt-5 space-y-4">
            <label className="flex items-start gap-2.5 rounded-xl border border-accent/30 bg-cream px-4 py-3 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={appliedForExcom}
                onChange={(e) => setAppliedForExcom(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
              />
              I'm applying for an ExCom position
            </label>

            <GoogleButton onClick={handleGoogleSignUp}>Continue with Google</GoogleButton>
          </div>

          <p className="mt-4 text-center text-xs text-ink/40">
            ExCom requests are approved by the President; other member
            requests are approved by the VPM.
          </p>
        </>
      )}

      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
