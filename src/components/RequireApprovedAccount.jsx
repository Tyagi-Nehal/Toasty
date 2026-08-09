import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'

export default function RequireApprovedAccount({ children }) {
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

  return children
}
