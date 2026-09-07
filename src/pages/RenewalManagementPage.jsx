import { useEffect, useState } from 'react'
import { Wallet, History, CalendarClock, Save } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import Avatar from '../components/Avatar.jsx'
import {
  getRosterWithStatus,
  getRosterRenewalLog,
  updateRosterRenewal,
} from '../lib/mockRosterStore.js'

const filters = ['All', 'Paid', 'Unpaid']

const selectClass =
  'w-full rounded-lg border border-accent/40 bg-cream px-2.5 py-1.5 text-sm text-ink focus:border-primary focus:outline-none'

const tabClass = (active) =>
  `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
    active
      ? 'bg-primary text-cream'
      : 'border border-accent/30 bg-white text-ink/70 hover:border-primary/50'
  }`

// Toastmasters runs on a fixed 6-month cycle (Apr-Sep, Oct-Mar). Always a
// rolling 4-year window starting at the current year — once a year ends,
// its two cycles drop off the list and the window's far end grows by one
// year, so this never needs manual upkeep as time passes.
function generateTerms() {
  const terms = []
  const startYear = new Date().getFullYear()
  for (let y = startYear; y <= startYear + 3; y++) {
    terms.push({ label: `Apr–Sep ${y}`, start: `${y}-04-01`, end: `${y}-09-30` })
    terms.push({ label: `Oct ${y}–Mar ${y + 1}`, start: `${y}-10-01`, end: `${y + 1}-03-31` })
  }
  return terms
}
const TERM_OPTIONS = generateTerms()

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// The term whose date range actually contains today.
function getCurrentTerm() {
  const today = todayISO()
  return TERM_OPTIONS.find((t) => t.start <= today && today <= t.end) ?? null
}

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export default function RenewalManagementPage() {
  const currentTerm = getCurrentTerm()

  const [members, setMembers] = useState([])
  const [log, setLog] = useState(() => getRosterRenewalLog())
  const [filter, setFilter] = useState('All')
  const [savingChanges, setSavingChanges] = useState(false)

  // Edits are staged here (keyed by member name — the roster has no
  // email) instead of writing to the database on every dropdown change —
  // nothing is saved until "Save Changes" is pressed.
  const [drafts, setDrafts] = useState({})

  function refresh() {
    getRosterWithStatus().then(setMembers)
    setLog(getRosterRenewalLog())
  }

  useEffect(() => {
    refresh()
  }, [])

  // The value a row should show right now: its pending draft if it has
  // one, otherwise its last-saved state. Keyed by email — the roster's
  // real identity — not name, so two members can't collide.
  function getEffective(member) {
    return drafts[member.email] ?? member
  }

  function updateDraft(member, patch) {
    setDrafts((prev) => ({
      ...prev,
      [member.email]: { ...getEffective(member), ...patch },
    }))
  }

  // Picking a term sets that member's active window to the term's full
  // range and marks them Paid — which is also what makes them active for
  // attendance/role auto-assign (see mockRosterStore.js). The Treasurer
  // can still flip the status dropdown to Unpaid right after if that's
  // wrong for this particular member; nothing writes to the database
  // until Save.
  function handleTermChange(member, termLabel) {
    const term = TERM_OPTIONS.find((t) => t.label === termLabel)
    if (!term) return
    updateDraft(member, {
      paymentStatus: 'paid',
      membershipStart: term.start,
      membershipEnd: term.end,
      cycleLabel: term.label,
    })
  }

  function handleStatusChange(member, paymentStatus) {
    updateDraft(member, { paymentStatus })
  }

  const pendingEmails = Object.keys(drafts)

  async function handleSaveChanges() {
    if (pendingEmails.length === 0) return
    setSavingChanges(true)
    await Promise.all(
      pendingEmails.map((email) => {
        const draft = drafts[email]
        return updateRosterRenewal(email, draft.name, {
          paymentStatus: draft.paymentStatus,
          membershipStart: draft.membershipStart,
          membershipEnd: draft.membershipEnd,
          cycleLabel: draft.cycleLabel,
        })
      }),
    )
    setSavingChanges(false)
    setDrafts({})
    refresh()
  }

  // Most urgent first: never renewed at all, then soonest-to-expire —
  // exactly who the Treasurer needs to chase, in order.
  const visible = (
    filter === 'All'
      ? members
      : members.filter((m) =>
          filter === 'Paid' ? m.paymentStatus === 'paid' : m.paymentStatus !== 'paid',
        )
  )
    .slice()
    .sort((a, b) => (a.membershipEnd ?? '').localeCompare(b.membershipEnd ?? ''))

  return (
    <MemberLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2">
          <Wallet size={22} className="text-primary" />
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            Renewal Management
          </h1>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          Every real club member shows up here. A member only counts as active for
          attendance and role assignment once you mark them Paid for a term — pick
          a term, set their status, and press Save Changes when you're done.
        </p>
        {currentTerm && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <CalendarClock size={12} />
            Current term: {currentTerm.label}
          </p>
        )}

        {/* Filter */}
        <div className="mt-5 flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={tabClass(filter === f)}>
              {f}
            </button>
          ))}
        </div>

        {/* Save Changes — commits every staged edit at once; nothing
            below is written until this is pressed. */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-white px-4 py-3">
          <span className="text-sm text-ink/60">
            {pendingEmails.length > 0
              ? `${pendingEmails.length} member${pendingEmails.length > 1 ? 's' : ''} with unsaved changes`
              : 'No unsaved changes'}
          </span>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={pendingEmails.length === 0 || savingChanges}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-cream shadow-sm shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Save size={15} />
            {savingChanges ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-accent/30 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-accent/20 bg-cream/60 text-xs uppercase tracking-wide text-ink/50">
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 font-semibold">Term</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((member) => {
                  const display = getEffective(member)
                  const hasDraft = Boolean(drafts[member.email])
                  // isActive reflects the last-saved value (member.isActive),
                  // not the unsaved draft — it only becomes real once Saved.
                  const memberIsActive = member.isActive
                  return (
                    <tr
                      key={member.email}
                      className={`border-b border-accent/10 last:border-0 ${hasDraft ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={member.name} size={28} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-ink">{member.name}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  memberIsActive ? 'bg-primary/10 text-primary' : 'bg-ink/10 text-ink/50'
                                }`}
                              >
                                {memberIsActive ? 'Active' : 'Inactive'}
                              </span>
                              {hasDraft && (
                                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                  Unsaved
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={display.cycleLabel ?? ''}
                          onChange={(e) => handleTermChange(member, e.target.value)}
                          className={selectClass}
                        >
                          <option value="" disabled>
                            Select a term
                          </option>
                          {TERM_OPTIONS.map((t) => (
                            <option key={t.label} value={t.label}>
                              {t.label}
                              {t.label === currentTerm?.label ? ' (current)' : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={display.paymentStatus === 'paid' ? 'paid' : 'pending'}
                          onChange={(e) => handleStatusChange(member, e.target.value)}
                          className={selectClass}
                        >
                          <option value="paid">Paid</option>
                          <option value="pending">Unpaid</option>
                        </select>
                      </td>
                    </tr>
                  )
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-sm text-ink/50">
                      {members.length === 0
                        ? 'No members on the roster yet.'
                        : 'No members with this status.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity log */}
        <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <History size={16} className="text-primary" />
            Activity Log
          </div>
          {log.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {log.map((entry) => (
                <li key={entry.id} className="border-l-2 border-accent/30 pl-3">
                  <p className="text-sm leading-snug text-ink/80">{entry.message}</p>
                  <p className="mt-0.5 text-xs text-ink/40">{timeAgo(entry.time)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink/50">No activity yet.</p>
          )}
        </div>
      </div>
    </MemberLayout>
  )
}
