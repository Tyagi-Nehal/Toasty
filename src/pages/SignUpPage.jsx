import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import GoogleButton from '../components/GoogleButton.jsx'
import PendingApprovalNotice from '../components/PendingApprovalNotice.jsx'
import { createAccount } from '../lib/mockAuth.js'

export default function SignUpPage() {
  const [loading, setLoading] = useState(false)
  const [account, setAccount] = useState(null)
  const [appliedForExcom, setAppliedForExcom] = useState(false)

  function handleGoogleSignUp() {
    setLoading(true)
    setTimeout(() => {
      const created = createAccount({ appliedForExcom })
      setAccount(created)
      setLoading(false)
    }, 700)
  }

  return (
    <AuthLayout>
      {account ? (
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

          <label className="mt-5 flex items-start gap-2.5 rounded-xl border border-accent/30 bg-cream px-4 py-3 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={appliedForExcom}
              onChange={(e) => setAppliedForExcom(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
            />
            I'm applying for an ExCom position
          </label>

          <div className="mt-4">
            <GoogleButton onClick={handleGoogleSignUp} loading={loading}>
              Continue with Google
            </GoogleButton>
          </div>

          <p className="mt-4 text-center text-xs text-ink/40">
            Only college email addresses (e.g. @learner.manipal.edu) can sign
            up. ExCom requests are approved by the President; other member
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
