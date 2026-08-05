const STORAGE_KEY = 'toasty_mock_account'

export function getAccount() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function createAccount({
  name = 'Alex Rao',
  email = 'alex.rao@learner.manipal.edu',
  appliedForExcom = false,
} = {}) {
  const account = { name, email, status: 'pending', excomRoles: [], appliedForExcom }
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

// Prototype-only: lets us preview ExCom-only pages without a real
// roles/permissions backend. `roles` is an array like ['Secretary'] or
// ['President']; pass [] to view as a regular member.
export function setExcomRoles(roles) {
  const account = getAccount()
  if (!account) return null
  const updated = { ...account, excomRoles: roles }
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
