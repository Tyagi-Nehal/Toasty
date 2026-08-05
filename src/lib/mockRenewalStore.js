// Mock renewal record for the signed-in member, persisted so the "Payment
// Done" claim survives a refresh — same one-time-submit pattern as
// mockPollStore.js and mockMOMStore.js. The Treasurer's Renewal Management
// page reads and confirms this same record (see mockRenewalManagementStore.js).

const STORAGE_KEY = 'toasty_renewal_status'

const defaultRenewal = {
  status: 'pending', // 'paid' | 'pending' | 'awaiting_confirmation'
  paidThroughTerm: null,
  claimedAt: null,
  utr: null,
}

export function getRenewalStatus() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...defaultRenewal, ...JSON.parse(raw) } : defaultRenewal
  } catch {
    return defaultRenewal
  }
}

export function markPaymentDone(utr) {
  const updated = {
    ...getRenewalStatus(),
    status: 'awaiting_confirmation',
    claimedAt: new Date().toISOString(),
    utr: utr?.trim() || null,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export function confirmRenewal(paidThroughTerm) {
  const updated = { ...getRenewalStatus(), status: 'paid', paidThroughTerm }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}
