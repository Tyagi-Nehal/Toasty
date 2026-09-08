import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import GoogleButton from '../components/GoogleButton.jsx'
import PendingApprovalNotice from '../components/PendingApprovalNotice.jsx'
import { useAuth } from '../lib/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { isFounderEmail } from '../lib/mockFounderAuth.js'

export default function SignUpPage() {
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
            Sign up with your college Google account to join your club on
            Toasty.
          </p>

          <div className="mt-5">
            <GoogleButton onClick={handleGoogleSignUp}>Continue with Google</GoogleButton>
          </div>

          <p className="mt-4 text-center text-xs text-ink/40">
            Your request is reviewed by the VPM. ExCom officers are
            appointed separately by the President.
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
