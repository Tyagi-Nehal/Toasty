import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import GoogleButton from '../components/GoogleButton.jsx'
import PendingApprovalNotice from '../components/PendingApprovalNotice.jsx'
import { useAuth } from '../lib/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { isFounderEmail } from '../lib/mockFounderAuth.js'

export default function LoginPage() {
  const { account } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isFounderEmail(account?.email)) {
      navigate('/founder-login')
    } else if (account?.status === 'approved') {
      navigate('/dashboard')
    }
  }, [account, navigate])

  function handleGoogleLogin() {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/login',
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
          <h1 className="text-xl font-bold text-ink sm:text-2xl">Welcome back</h1>
          <p className="mt-1.5 text-sm text-ink/60">
            Log in with the Google account you used to sign up.
          </p>

          <div className="mt-6">
            <GoogleButton onClick={handleGoogleLogin}>Continue with Google</GoogleButton>
          </div>

          <p className="mt-6 text-center text-sm text-ink/60">
            New to Toasty?{' '}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </>
      )}
    </AuthLayout>
  )
}
