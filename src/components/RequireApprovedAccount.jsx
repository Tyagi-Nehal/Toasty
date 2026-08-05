import { Navigate } from 'react-router-dom'
import { getAccount } from '../lib/mockAuth.js'

export default function RequireApprovedAccount({ children }) {
  const account = getAccount()

  if (!account || account.status !== 'approved') {
    return <Navigate to="/login" replace />
  }

  return children
}
