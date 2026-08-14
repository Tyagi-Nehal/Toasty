import { useEffect, useState } from 'react'
import { Wallet, History, CheckSquare, CalendarClock, Save } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import Avatar from '../components/Avatar.jsx'
import {
  getMembersWithStatus,
  getRenewalLog,
  isActive,
  updateMemberRenewal,
} from '../lib/mockMembershipStore.js'

const filters = ['All', 'Paid', 'Pending', 'Overdue']

const selectClass =
  'rounded-lg border border-accent/40 bg-cream px-2.5 py-1.5 text-sm text-ink focus:border-primary focus:outline-none'

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

// Renewing/extending a member into an active window is itself the
// record that they paid — no separate manual "mark as Paid" step needed
// for the common case. Doesn't touch payment status when it's being
// edited directly (the dropdown below), only when a date/cycle change
// is what made them active.
function autoPaymentStatus(currentStatus, membershipEnd) {
  return isActive(membershipEnd) ? 'paid' : currentStatus
}

function formatRange(start, end) {
  const fmt = (d) =>
    new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
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
  const [log, setLog] = useState(() => getRenewalLog())
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState(new Set())

  // Edits made in the table are staged here (keyed by email) instead of
  // saving immediately on every change — editing one member's fields
  // used to write straight to the database on each keystroke/selection,
  // and a slow or out-of-order refresh from an earlier edit could land
  // after a later one, making a different member's row appear to change
  // on its own. Nothing touches the database until Save Changes.
  const [drafts, setDrafts] = useState({})
  const [savingChanges, setSavingChanges] = useState(false)

  const [bulkTerm, setBulkTerm] = useState(currentTerm?.label ?? '')
  const [bulkStart, setBulkStart] = useState(currentTerm?.start ?? '')
  const [bulkEnd, setBulkEnd] = useState(currentTerm?.end ?? '')
  const [applyingBulk, setApplyingBulk] = useState(false)

  function refresh() {
    getMembersWithStatus().then(setMembers)
    setLog(getRenewalLog())
  }

  useEffect(() => {
    refresh()
  }, [])

  // The value a row should show right now: its pending draft if it has
  // one, otherwise its last-saved state.
  function getEffective(member) {
    return drafts[member.email] ?? member
  }

  // Every field edit builds on the row's current effective values (draft
  // if one exists, else the saved member) and replaces only that row's
  // draft entry — so editing member A can never bleed into member B's
  // draft, and re-editing the same field twice just overwrites the one
  // draft rather than compounding.
  function updateDraft(member, patch) {
    setDrafts((prev) => ({
      ...prev,
      [member.email]: { ...getEffective(member), ...patch },
    }))
  }

  function handleFieldChange(member, field, value) {
    const patch = { [field]: value }
    if (field === 'membershipStart' || field === 'membershipEnd') {
      const next = { ...getEffective(member), ...patch }
      patch.paymentStatus = autoPaymentStatus(next.paymentStatus, next.membershipEnd)
    }
    updateDraft(member, patch)
  }

  // Picking a cycle resets the active period to that cycle's full range;
  // the Treasurer can then narrow it for a partial renewal via the date
  // inputs, which stay bounded to this cycle's start/end.
  function handleTermChange(member, termLabel) {
    const term = TERM_OPTIONS.find((t) => t.label === termLabel)
    const current = getEffective(member)
    const membershipStart = term ? term.start : current.membershipStart
    const membershipEnd = term ? term.end : current.membershipEnd
    updateDraft(member, {
      cycleLabel: term ? term.label : null,
      membershipStart,
      membershipEnd,
      paymentStatus: autoPaymentStatus(current.paymentStatus, membershipEnd),
    })
  }

  const pendingEmails = Object.keys(drafts)

  async function handleSaveChanges() {
    if (pendingEmails.length === 0) return
    setSavingChanges(true)
    await Promise.all(
      pendingEmails.map((email) => {
        const member = members.find((m) => m.email === email)
        const draft = drafts[email]
        return updateMemberRenewal(email, member?.name ?? email, {
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

  function toggleSelected(email) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })
  }

  function toggleSelectAll(emails) {
    setSelected((prev) => (emails.every((e) => prev.has(e)) ? new Set() : new Set(emails)))
  }

  // Changing the bulk cycle resets the dates to that term's full range —
  // the Treasurer can then narrow just the start (or end) for a late
  // joiner/early leaver before applying to everyone selected.
  function handleBulkTermChange(label) {
    setBulkTerm(label)
    const term = TERM_OPTIONS.find((t) => t.label === label)
    setBulkStart(term?.start ?? '')
    setBulkEnd(term?.end ?? '')
  }

  // Rolls every selected member into one cycle at once — the real
  // Toastmasters workflow twice a year (Apr/Oct) is renewing most of the
  // club together, not one dropdown at a time. Applies immediately
  // (unlike individual edits above) since this already has its own
  // explicit commit step; also drops any pending individual draft for
  // whoever's included, so a stale unsaved edit can't linger on top of
  // what was just applied.
  async function handleBulkApply() {
    const term = TERM_OPTIONS.find((t) => t.label === bulkTerm)
    if (!term || selected.size === 0 || !bulkStart || !bulkEnd) return
    setApplyingBulk(true)
    const emails = [...selected]
    await Promise.all(
      emails.map((email) => {
        const member = members.find((m) => m.email === email)
        return updateMemberRenewal(email, member?.name ?? email, {
          paymentStatus: autoPaymentStatus(member?.paymentStatus ?? 'pending', bulkEnd),
          membershipStart: bulkStart,
          membershipEnd: bulkEnd,
          cycleLabel: term.label,
        })
      }),
    )
    setApplyingBulk(false)
    setSelected(new Set())
    setDrafts((prev) => {
      const next = { ...prev }
      for (const email of emails) delete next[email]
      return next
    })
    refresh()
  }

  // Most urgent first: never set up at all, then soonest-to-expire —
  // exactly who the Treasurer needs to chase, in order.
  const visible = (filter === 'All' ? members : members.filter((m) => m.paymentStatus === filter.toLowerCase()))
    .slice()
    .sort((a, b) => (a.membershipEnd ?? '').localeCompare(b.membershipEnd ?? ''))
  const visibleEmails = visible.map((m) => m.email)
  const allVisibleSelected = visibleEmails.length > 0 && visibleEmails.every((e) => selected.has(e))

  return (
    <MemberLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2">
          <Wallet size={22} className="text-primary" />
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            Renewal Management
          </h1>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          Every member approved by the VPM, plus everyone on ExCom, shows up here
          automatically as soon as they sign in. A member who isn't renewed into a
          new term automatically becomes Inactive — nothing to do for that.
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

        {/* Bulk renewal — the real cycle-rollover workflow twice a year */}
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-accent/40 bg-white p-4">
          <CheckSquare size={16} className="shrink-0 text-primary" />
          <span className="text-sm text-ink/60">
            {selected.size > 0 ? `${selected.size} selected` : 'Select members below to renew them together'}
          </span>
          <select value={bulkTerm} onChange={(e) => handleBulkTermChange(e.target.value)} className={selectClass}>
            {TERM_OPTIONS.map((t) => (
              <option key={t.label} value={t.label}>
                {t.label}
                {t.label === currentTerm?.label ? ' (current)' : ''}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <input type="date" value={bulkStart} onChange={(e) => setBulkStart(e.target.value)} className={selectClass} />
            <span className="text-ink/40">–</span>
            <input type="date" value={bulkEnd} onChange={(e) => setBulkEnd(e.target.value)} className={selectClass} />
          </div>
          <button
            type="button"
            onClick={handleBulkApply}
            disabled={selected.size === 0 || applyingBulk || !bulkStart || !bulkEnd}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-cream shadow-sm shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {applyingBulk ? 'Applying…' : 'Apply to selected'}
          </button>
          <p className="w-full text-xs text-ink/40">
            Defaults to the current term for everyone — adjust the dates above first if
            anyone selected joined late or is leaving early.
          </p>
        </div>

        {/* Save Changes — commits every individually-edited row's staged
            changes at once; nothing below is written until this is pressed. */}
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
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-accent/20 bg-cream/60 text-xs uppercase tracking-wide text-ink/50">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={() => toggleSelectAll(visibleEmails)}
                      aria-label="Select all visible members"
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 font-semibold">Payment Status</th>
                  <th className="px-4 py-3 font-semibold">Cycle</th>
                  <th className="px-4 py-3 font-semibold">Active Period</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((member) => {
                  const display = getEffective(member)
                  const hasDraft = Boolean(drafts[member.email])
                  const displayIsActive = isActive(display.membershipEnd)
                  const selectedTerm = TERM_OPTIONS.find((t) => t.label === display.cycleLabel)
                  return (
                    <tr
                      key={member.email}
                      className={`border-b border-accent/10 last:border-0 ${hasDraft ? 'bg-primary/5' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(member.email)}
                          onChange={() => toggleSelected(member.email)}
                          aria-label={`Select ${member.name}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={member.name} size={28} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-ink">{member.name}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  displayIsActive ? 'bg-primary/10 text-primary' : 'bg-ink/10 text-ink/50'
                                }`}
                              >
                                {displayIsActive ? 'Active' : 'Inactive'}
                              </span>
                              {hasDraft && (
                                <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                                  Unsaved
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs text-ink/40">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={display.paymentStatus}
                          onChange={(e) => handleFieldChange(member, 'paymentStatus', e.target.value)}
                          className={selectClass}
                        >
                          <option value="paid">Paid</option>
                          <option value="pending">Pending</option>
                          <option value="overdue">Overdue</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={display.cycleLabel ?? ''}
                          onChange={(e) => handleTermChange(member, e.target.value)}
                          className={selectClass}
                        >
                          <option value="">Custom</option>
                          {TERM_OPTIONS.map((t) => (
                            <option key={t.label} value={t.label}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                        {selected.has(member.email) && bulkTerm && bulkTerm !== display.cycleLabel && (
                          <p className="mt-1 text-[11px] font-medium text-primary">
                            → {bulkTerm} on Apply
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={display.membershipStart ?? ''}
                            min={selectedTerm?.start}
                            max={selectedTerm?.end}
                            onChange={(e) => handleFieldChange(member, 'membershipStart', e.target.value)}
                            className={selectClass}
                          />
                          <span className="text-ink/40">–</span>
                          <input
                            type="date"
                            value={display.membershipEnd ?? ''}
                            min={selectedTerm?.start}
                            max={selectedTerm?.end}
                            onChange={(e) => handleFieldChange(member, 'membershipEnd', e.target.value)}
                            className={selectClass}
                          />
                        </div>
                        {selectedTerm && (
                          <p className="mt-1 text-[11px] text-ink/40">
                            Within {formatRange(selectedTerm.start, selectedTerm.end)}
                          </p>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink/50">
                      {members.length === 0
                        ? 'No approved members yet — they appear here once the VPM approves their signup, or once they’re added to ExCom.'
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
