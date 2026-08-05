import { Navigate } from 'react-router-dom'
import { getAccount, hasExcomRole } from '../lib/mockAuth.js'

export default function RequireExcomRole({ role, children }) {
  const account = getAccount()

  if (!account || account.status !== 'approved') {
    return <Navigate to="/login" replace />
  }
  if (!hasExcomRole(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
