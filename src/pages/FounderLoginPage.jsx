import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, ShieldCheck } from 'lucide-react'
import AuthLayout from '../components/AuthLayout.jsx'
import GoogleButton from '../components/GoogleButton.jsx'
import { useAuth } from '../lib/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { isFounderEmail } from '../lib/mockFounderAuth.js'

export default function FounderLoginPage() {
  const { account } = useAuth()
  const navigate = useNavigate()
  const isFounder = isFounderEmail(account?.email)

  useEffect(() => {
    if (isFounder) navigate('/club-review')
  }, [isFounder, navigate])

  function handleGoogleLogin() {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/founder-login',
        queryParams: { prompt: 'select_account' },
      },
    })
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
        Reserved for the Toasty team to review new club registrations. Sign
        in with the Toasty Google account.
      </p>

      {account && !isFounder ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-center">
            <ShieldAlert size={20} className="text-red-600" />
            <p className="text-sm font-medium text-red-700">
              {account.email} isn't authorized as a Toasty founder.
            </p>
          </div>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Try a different Google account
          </button>
        </div>
      ) : (
        <div className="mt-6">
          <GoogleButton onClick={handleGoogleLogin}>Continue with Google</GoogleButton>
        </div>
      )}
    </AuthLayout>
  )
}
