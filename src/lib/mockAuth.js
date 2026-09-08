import { getRolesForEmail, getNamesByRoleForEmail, ASSOCIATE_ELIGIBLE_ROLES } from './mockExcomRegistry.js'
import { verifyPresident } from './mockClubRegistry.js'
import { getOrCreateSignupStatus } from './mockMemberSignups.js'
import { submitExcomApplication } from './mockExcomApplications.js'

const STORAGE_KEY = 'toasty_mock_account'
const APPLIED_FOR_EXCOM_KEY = 'toasty_applied_for_excom'
const SIGNUP_NAME_KEY = 'toasty_signup_name'
const REQUESTED_EXCOM_ROLE_KEY = 'toasty_requested_excom_role'
const ROLE_OVERRIDE_KEY = 'toasty_active_role_override'

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
// (initial load or right after the Google OAuth redirect completes) —
// the email is always the real, Google-verified identity (that's what
// every RLS policy trusts), but the display name can come from a typed
// Sign Up form instead of whatever name Google has on file, via
// SIGNUP_NAME_KEY (set once, right before the OAuth redirect, and
// consumed here exactly once — same pattern as APPLIED_FOR_EXCOM_KEY).
export async function syncAccountFromSupabaseUser(user) {
  const email = (user.email ?? '').trim().toLowerCase()
  const googleName = user.user_metadata?.full_name || user.user_metadata?.name || null

  const existing = getAccount()
  const appliedForExcom =
    sessionStorage.getItem(APPLIED_FOR_EXCOM_KEY) === 'true'
      ? true
      : (existing?.email === email ? (existing.appliedForExcom ?? false) : false)
  sessionStorage.removeItem(APPLIED_FOR_EXCOM_KEY)

  const typedName = sessionStorage.getItem(SIGNUP_NAME_KEY)?.trim() || null
  sessionStorage.removeItem(SIGNUP_NAME_KEY)
  const requestedExcomRole = sessionStorage.getItem(REQUESTED_EXCOM_ROLE_KEY)
  sessionStorage.removeItem(REQUESTED_EXCOM_ROLE_KEY)

  const { verified: isPresident, name: presidentName } = await verifyPresident(email)
  const roles = isPresident ? ['President'] : await getRolesForEmail(email)

  let status, resolvedName
  let excomRoleNames = {}
  if (roles.length > 0) {
    excomRoleNames = isPresident ? { President: presidentName } : await getNamesByRoleForEmail(email)
    // If a role's already been picked for this session (see
    // setActiveRoleOverride below), use that role's own registered name —
    // not just whichever role was appointed most recently for this email —
    // so a shared email tested under several roles shows the right person
    // for the role actually being acted as, not the last one appointed.
    const activeOverride = getActiveRoleOverride()
    const registeredName =
      (activeOverride && excomRoleNames[activeOverride]) || excomRoleNames[roles[0]]
    resolvedName = registeredName || googleName || email
    status = 'approved'
  } else {
    const signup = await getOrCreateSignupStatus({
      email,
      name: typedName || googleName || email,
      appliedForExcom,
    })
    resolvedName = signup.name || googleName || email
    status = signup.status
    // A pending application, reviewed by the President — separate from
    // (and in addition to) the general member signup above, which the
    // VPM reviews. Only fires once, right after the Sign Up form is
    // submitted with the role dropdown filled in.
    if (requestedExcomRole) {
      await submitExcomApplication({
        role: requestedExcomRole,
        name: typedName || googleName || email,
        email,
      })
    }
  }

  const account = {
    name: resolvedName,
    email,
    status,
    excomRoles: roles,
    excomRoleNames,
    appliedForExcom,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(account))
  return account
}

// Testing convenience: when one email holds multiple ExCom roles (see
// getRolesForEmail in mockExcomRegistry.js), let the person pick which
// single role to act as for this browser session, instead of always
// getting every role's access/nav-links at once. Session-only (cleared
// on sign-out or tab close) — doesn't change what roles the account
// actually has, just narrows which one is "active" right now.
export function setActiveRoleOverride(role) {
  sessionStorage.setItem(ROLE_OVERRIDE_KEY, role)
  // Immediately correct the displayed/matched name to the one registered
  // for this specific role, so switching roles doesn't leave the account
  // showing whichever role's name happened to load first.
  const account = getAccount()
  const nameForRole = account?.excomRoleNames?.[role]
  if (account && nameForRole && account.name !== nameForRole) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...account, name: nameForRole }))
  }
}

export function getActiveRoleOverride() {
  return sessionStorage.getItem(ROLE_OVERRIDE_KEY)
}

export function clearActiveRoleOverride() {
  sessionStorage.removeItem(ROLE_OVERRIDE_KEY)
}

// The role shown in the header badge etc. — the active override if one's
// set, otherwise just the first (or only) role on the account.
export function getDisplayRole(account) {
  const override = getActiveRoleOverride()
  if (override && account?.excomRoles?.includes(override)) return override
  return account?.excomRoles?.[0] ?? null
}

// An "Ass. <role>" appointee gets the same page access as the primary
// role (they can actually do the work, which is the point of having an
// associate) — but their own name/title still displays as "Ass. X"
// elsewhere (getDisplayRole), and points get attributed to their own
// email specifically, not folded into the primary holder's (see
// mockPointsStore.js / getHeldRoleForEmailAndBase).
function matchesRole(heldRole, wantedRole) {
  if (heldRole === wantedRole) return true
  return ASSOCIATE_ELIGIBLE_ROLES.includes(wantedRole) && heldRole === `Ass. ${wantedRole}`
}

export function hasExcomRole(role) {
  const account = getAccount()
  if (!account) return false
  if (account.excomRoles?.includes('President')) return true
  const override = getActiveRoleOverride()
  if (override && account.excomRoles?.length > 1) return matchesRole(override, role)
  return account.excomRoles?.some((held) => matchesRole(held, role)) ?? false
}

export function clearAccount() {
  localStorage.removeItem(STORAGE_KEY)
  clearActiveRoleOverride()
}
