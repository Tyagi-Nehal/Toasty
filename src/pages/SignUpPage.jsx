import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import GoogleButton from '../components/GoogleButton.jsx'
import PendingApprovalNotice from '../components/PendingApprovalNotice.jsx'
import { createAccount } from '../lib/mockAuth.js'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [account, setAccount] = useState(null)
  const [appliedForExcom, setAppliedForExcom] = useState(false)
  const navigate = useNavigate()

  function handleGoogleSignUp(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setLoading(true)
    setTimeout(() => {
      const created = createAccount({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        appliedForExcom,
      })
      setLoading(false)
      if (created.status === 'approved') {
        navigate('/dashboard')
        return
      }
      setAccount(created)
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

          <form onSubmit={handleGoogleSignUp} className="mt-5 space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-ink">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-ink">
                Google Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@learner.manipal.edu"
                className="mt-1.5 w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
              />
              <p className="mt-1 text-xs text-ink/40">
                Prototype only — there's no real Google OAuth yet, so type
                the email you want to sign up with.
              </p>
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

            <GoogleButton onClick={handleGoogleSignUp} loading={loading}>
              Continue with Google
            </GoogleButton>
          </form>

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
