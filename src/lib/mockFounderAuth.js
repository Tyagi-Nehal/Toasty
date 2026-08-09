// Founder access (Isha & Nehal, via the shared jointoasty@gmail.com Google
// account) — real check against the signed-in email from AuthContext, no
// separate login system. See supabase/schema.sql for the matching
// database-side restriction (RLS UPDATE policies use the same email).

const FOUNDER_EMAILS = (import.meta.env.VITE_FOUNDER_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export function isFounderEmail(email) {
  return FOUNDER_EMAILS.includes((email ?? '').trim().toLowerCase())
}
