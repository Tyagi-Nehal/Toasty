import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import GoogleButton from '../components/GoogleButton.jsx'
import PendingApprovalNotice from '../components/PendingApprovalNotice.jsx'
import { useAuth } from '../lib/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { isFounderEmail } from '../lib/mockFounderAuth.js'
import { getActiveRoleOverride, setActiveRoleOverride } from '../lib/mockAuth.js'

export default function LoginPage() {
  const { account } = useAuth()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState(null)

  const needsRolePick =
    account?.status === 'approved' &&
    (account.excomRoles?.length ?? 0) > 1 &&
    !getActiveRoleOverride()

  useEffect(() => {
    if (isFounderEmail(account?.email)) {
      navigate('/founder-login')
    } else if (account?.status === 'approved' && !needsRolePick) {
      navigate('/dashboard')
    }
  }, [account, needsRolePick, navigate])

  function handleContinueAsRole() {
    if (!selectedRole) return
    setActiveRoleOverride(selectedRole)
    navigate('/dashboard')
  }

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
      {needsRolePick ? (
        <>
          <h1 className="text-xl font-bold text-ink sm:text-2xl">Continue as...</h1>
          <p className="mt-1.5 text-sm text-ink/60">
            {account.email} is registered under multiple ExCom roles. Pick
            one to test that role's dashboard this session.
          </p>

          <div className="mt-6 space-y-2">
            {account.excomRoles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`w-full rounded-xl border-2 px-4 py-2.5 text-left text-sm font-semibold transition ${
                  selectedRole === role
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-accent/25 text-ink/70'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleContinueAsRole}
            disabled={!selectedRole}
            className="mt-4 w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>
        </>
      ) : account?.status === 'pending' && !isFounderEmail(account?.email) ? (
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
