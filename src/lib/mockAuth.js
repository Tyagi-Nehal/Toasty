import { getRoleForEmail, getNameForEmail } from './mockExcomRegistry.js'
import { isVerifiedPresident, getVerifiedPresidentName } from './mockClubRegistry.js'

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
//
// The Login page only ever collects an email (no name field — it's meant
// to simulate Google SSO, which wouldn't ask either), so for a role-matched
// account the real name is looked up from whichever registry matched
// instead of falling back to the generic default.
export function createAccount({
  name,
  email = 'alex.rao@learner.manipal.edu',
  appliedForExcom = false,
} = {}) {
  const isPresident = isVerifiedPresident(email)
  const role = isPresident ? 'President' : getRoleForEmail(email)
  const registeredName = isPresident ? getVerifiedPresidentName(email) : getNameForEmail(email)
  const resolvedName = name || registeredName || 'Alex Rao'

  const account = {
    name: resolvedName,
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
