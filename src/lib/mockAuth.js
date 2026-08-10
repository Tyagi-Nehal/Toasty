import { getRolesForEmail, getNameForEmail } from './mockExcomRegistry.js'
import { verifyPresident } from './mockClubRegistry.js'
import { getOrCreateSignupStatus } from './mockMemberSignups.js'

const STORAGE_KEY = 'toasty_mock_account'
const APPLIED_FOR_EXCOM_KEY = 'toasty_applied_for_excom'

export function getAccount() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Role-based SSO: if the signed-in email was pre-registered by a President
// (mockExcomRegistry.js) or approved as a verified president
// (mockClubRegistry.js, Supabase-backed), the account is auto-approved
// straight into that role's dashboard — no generic VPM approval step.
// Anyone else falls back to the existing generic member flow (pending
// until VPM approves).
//
// Called from AuthContext.jsx whenever a real Supabase session resolves
// (initial load or right after the Google OAuth redirect completes) — the
// name/email come from the real Google identity, not a typed form.
export async function syncAccountFromSupabaseUser(user) {
  const email = (user.email ?? '').trim().toLowerCase()
  const googleName = user.user_metadata?.full_name || user.user_metadata?.name || null

  const existing = getAccount()
  const appliedForExcom =
    sessionStorage.getItem(APPLIED_FOR_EXCOM_KEY) === 'true'
      ? true
      : (existing?.email === email ? (existing.appliedForExcom ?? false) : false)
  sessionStorage.removeItem(APPLIED_FOR_EXCOM_KEY)

  const { verified: isPresident, name: presidentName } = await verifyPresident(email)
  const roles = isPresident ? ['President'] : await getRolesForEmail(email)

  let status, resolvedName
  if (roles.length > 0) {
    const registeredName = isPresident ? presidentName : await getNameForEmail(email)
    resolvedName = registeredName || googleName || email
    status = 'approved'
  } else {
    const signup = await getOrCreateSignupStatus({
      email,
      name: googleName || email,
      appliedForExcom,
    })
    resolvedName = signup.name || googleName || email
    status = signup.status
  }

  const account = {
    name: resolvedName,
    email,
    status,
    excomRoles: roles,
    appliedForExcom,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(account))
  return account
}

export function hasExcomRole(role) {
  const account = getAccount()
  if (!account) return false
  return account.excomRoles?.includes('President') || account.excomRoles?.includes(role)
}

export function clearAccount() {
  localStorage.removeItem(STORAGE_KEY)
}
