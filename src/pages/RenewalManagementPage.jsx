import { useEffect, useState } from 'react'
import { Wallet, History, CheckSquare } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import Avatar from '../components/Avatar.jsx'
import {
  getMembersWithStatus,
  getRenewalLog,
  updateMemberRenewal,
} from '../lib/mockMembershipStore.js'

const filters = ['All', 'Paid', 'Pending', 'Overdue']

const selectClass =
  'rounded-lg border border-accent/40 bg-cream px-2.5 py-1.5 text-sm text-ink focus:border-primary focus:outline-none'

// Toastmasters runs on a fixed 6-month cycle (Apr-Sep, Oct-Mar) — this
// generates that real cycle's terms across a few years each way so the
// Treasurer can pick "Apr-Sep 2026" instead of clicking two calendar
// dates by hand. The two date inputs stay available below for anything
// that doesn't fit a standard term.
//
// The club's terms start Oct 2025 — nothing earlier is offered. That
// first term ran Oct 2025-Feb 2026 (5 months, shorter than the usual 6);
// every cycle from Oct 2026 onward follows the standard Oct-Mar pattern.
function generateTerms() {
  const terms = []
  const startYear = new Date().getFullYear() - 1
  for (let y = startYear; y <= startYear + 3; y++) {
    if (y !== 2025) {
      terms.push({ label: `Apr–Sep ${y}`, start: `${y}-04-01`, end: `${y}-09-30` })
    }
    if (y === 2025) {
      terms.push({ label: 'Oct 2025–Feb 2026', start: '2025-10-01', end: '2026-02-28' })
    } else {
      terms.push({ label: `Oct ${y}–Mar ${y + 1}`, start: `${y}-10-01`, end: `${y + 1}-03-31` })
    }
  }
  return terms
}
const TERM_OPTIONS = generateTerms()

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
  const [members, setMembers] = useState([])
  const [log, setLog] = useState(() => getRenewalLog())
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState(new Set())
  const [bulkTerm, setBulkTerm] = useState(TERM_OPTIONS[0]?.label ?? '')
  const [applyingBulk, setApplyingBulk] = useState(false)

  function refresh() {
    getMembersWithStatus().then(setMembers)
    setLog(getRenewalLog())
  }

  useEffect(() => {
    refresh()
  }, [])

  // Editing a date within an already-selected cycle keeps that cycle
  // (a partial start/end for someone who joined or left mid-term is still
  // "that cycle," not "Custom") — only the Cycle dropdown itself changes
  // cycleLabel.
  async function handleFieldChange(member, field, value) {
    await updateMemberRenewal(member.email, member.name, {
      paymentStatus: member.paymentStatus,
      membershipStart: member.membershipStart,
      membershipEnd: member.membershipEnd,
      cycleLabel: member.cycleLabel,
      [field]: value,
    })
    refresh()
  }

  // Picking a cycle resets the active period to that cycle's full range;
  // the Treasurer can then narrow it for a partial renewal via the date
  // inputs, which stay bounded to this cycle's start/end.
  async function handleTermChange(member, termLabel) {
    const term = TERM_OPTIONS.find((t) => t.label === termLabel)
    await updateMemberRenewal(member.email, member.name, {
      paymentStatus: member.paymentStatus,
      membershipStart: term ? term.start : member.membershipStart,
      membershipEnd: term ? term.end : member.membershipEnd,
      cycleLabel: term ? term.label : null,
    })
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

  // Rolls every selected member into one cycle at once — the real
  // Toastmasters workflow twice a year (Apr/Oct) is renewing most of the
  // club together, not one dropdown at a time. Each member keeps their
  // own payment status; only the cycle dates change.
  async function handleBulkApply() {
    const term = TERM_OPTIONS.find((t) => t.label === bulkTerm)
    if (!term || selected.size === 0) return
    setApplyingBulk(true)
    await Promise.all(
      [...selected].map((email) => {
        const member = members.find((m) => m.email === email)
        return updateMemberRenewal(email, member?.name ?? email, {
          paymentStatus: member?.paymentStatus ?? 'pending',
          membershipStart: term.start,
          membershipEnd: term.end,
          cycleLabel: term.label,
        })
      }),
    )
    setApplyingBulk(false)
    setSelected(new Set())
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
          automatically as soon as they sign in — nothing to add manually. Pick each
          member's 6-month cycle (Apr–Sep or Oct–Mar) — Active/Inactive follows
          automatically from whether today falls inside it. Use "Custom" only for a
          range that doesn't fit the standard cycle.
        </p>

        {/* Filter */}
        <div className="mt-5 flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === f
                  ? 'bg-primary text-cream'
                  : 'border border-accent/30 bg-white text-ink/70 hover:border-primary/50'
              }`}
            >
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
          <select
            value={bulkTerm}
            onChange={(e) => setBulkTerm(e.target.value)}
            className={selectClass}
          >
            {TERM_OPTIONS.map((t) => (
              <option key={t.label} value={t.label}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleBulkApply}
            disabled={selected.size === 0 || applyingBulk}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-cream shadow-sm shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {applyingBulk ? 'Applying…' : 'Apply to selected'}
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
                  const selectedTerm = TERM_OPTIONS.find((t) => t.label === member.cycleLabel)
                  return (
                    <tr key={member.email} className="border-b border-accent/10 last:border-0">
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
                                  member.isActive ? 'bg-primary/10 text-primary' : 'bg-ink/10 text-ink/50'
                                }`}
                              >
                                {member.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="truncate text-xs text-ink/40">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={member.paymentStatus}
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
                          value={member.cycleLabel ?? ''}
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
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={member.membershipStart ?? ''}
                            min={selectedTerm?.start}
                            max={selectedTerm?.end}
                            onChange={(e) => handleFieldChange(member, 'membershipStart', e.target.value)}
                            className={selectClass}
                          />
                          <span className="text-ink/40">–</span>
                          <input
                            type="date"
                            value={member.membershipEnd ?? ''}
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
