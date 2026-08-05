import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import AuthLayout from '../components/AuthLayout.jsx'
import GoogleButton from '../components/GoogleButton.jsx'
import PendingApprovalNotice from '../components/PendingApprovalNotice.jsx'
import { getAccount, createAccount, setAccountStatus } from '../lib/mockAuth.js'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [account, setAccount] = useState(null)
  const navigate = useNavigate()

  function handleGoogleLogin() {
    setLoading(true)
    setTimeout(() => {
      const existing = getAccount() ?? createAccount()
      setLoading(false)
      if (existing.status === 'approved') {
        navigate('/dashboard')
        return
      }
      setAccount(existing)
    }, 700)
  }

  function handlePrototypeApprove() {
    setAccountStatus('approved')
    setAccount(null)
    navigate('/dashboard')
  }

  return (
    <AuthLayout>
      {account ? (
        <>
          <PendingApprovalNotice email={account.email} />
          <div className="mt-5 rounded-xl border border-dashed border-accent/50 bg-cream p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink/60">
              <FlaskConical size={14} className="text-primary" />
              Prototype only
            </p>
            <p className="mt-1 text-xs text-ink/50">
              There's no real VPM approval yet — simulate it to preview what
              an approved member sees.
            </p>
            <button
              type="button"
              onClick={handlePrototypeApprove}
              className="mt-2 w-full rounded-lg bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
            >
              Simulate VPM approval &amp; continue
            </button>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold text-ink sm:text-2xl">Welcome back</h1>
          <p className="mt-1.5 text-sm text-ink/60">
            Log in with the Google account you used to sign up.
          </p>

          <div className="mt-6">
            <GoogleButton onClick={handleGoogleLogin} loading={loading}>
              Continue with Google
            </GoogleButton>
          </div>
        </>
      )}

      <p className="mt-6 text-center text-sm text-ink/60">
        New to Toasty?{' '}
        <Link to="/signup" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
