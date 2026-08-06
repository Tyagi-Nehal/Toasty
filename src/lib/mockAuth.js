import { getRoleForEmail } from './mockExcomRegistry.js'
import { isVerifiedPresident } from './mockClubRegistry.js'

const STORAGE_KEY = 'toasty_mock_account'

export function getAccount() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Role-based SSO: if the signing-in email was pre-registered by a President
// (mockExcomRegistry.js) or approved as a verified president
// (mockClubRegistry.js), the account is auto-approved straight into that
// role's dashboard — no generic VPM approval step. Anyone else falls back
// to the existing generic member flow (pending until VPM approves).
export function createAccount({
  name = 'Alex Rao',
  email = 'alex.rao@learner.manipal.edu',
  appliedForExcom = false,
} = {}) {
  const role = isVerifiedPresident(email) ? 'President' : getRoleForEmail(email)

  const account = {
    name,
    email,
    status: role ? 'approved' : 'pending',
    excomRoles: role ? [role] : [],
    appliedForExcom,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(account))
  return account
}

export function setAccountStatus(status) {
  const account = getAccount()
  if (!account) return null
  const updated = { ...account, status }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export function hasExcomRole(role) {
  const account = getAccount()
  if (!account) return false
  return account.excomRoles?.includes('President') || account.excomRoles?.includes(role)
}

export function clearAccount() {
  localStorage.removeItem(STORAGE_KEY)
}
