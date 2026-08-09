import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'
import { hasExcomRole } from '../lib/mockAuth.js'

export default function RequireExcomRole({ role, children }) {
  const { account, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-sm text-ink/50">Loading...</p>
      </div>
    )
  }
  if (!account || account.status !== 'approved') {
    return <Navigate to="/login" replace />
  }
  if (!hasExcomRole(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
