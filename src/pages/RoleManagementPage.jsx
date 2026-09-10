import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CalendarX2,
  CheckCircle2,
  LockOpen,
  PencilLine,
  Plus,
  SlidersHorizontal,
  Trash2,
  Zap,
} from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import RoleOverrideModal from '../components/RoleOverrideModal.jsx'
import FinalizeConfirmModal from '../components/FinalizeConfirmModal.jsx'
import CancelMeetingModal from '../components/CancelMeetingModal.jsx'
import RescheduleMeetingModal from '../components/RescheduleMeetingModal.jsx'
import CancelledMeetingNotice from '../components/CancelledMeetingNotice.jsx'
import { roleCatalog } from '../data/roleCatalog.js'
import {
  VPE_ONLY_ROLE_IDS,
  addMeetingRole,
  autoAssignMeeting,
  cancelMeeting,
  canFinalizeMeeting,
  finalizeMeeting,
  findNextActiveMeeting,
  getMeetingRoleEntries,
  getMeetings,
  getNotifications,
  getRoleFillSummary,
  overrideRole,
  removeMeetingRole,
  rescheduleMeeting,
  uncancelMeeting,
  unfinalizeMeeting,
} from '../lib/mockRolesStore.js'
import { getMembers, scoringWeights } from '../lib/mockRosterStore.js'

const OTHER_ROLE_VALUE = '__other__'

const statusLabels = {
  open: { text: 'Open', className: 'bg-accent/15 text-primary' },
  taken: { text: 'Self-selected', className: 'bg-cream text-ink/70' },
  auto: { text: 'Auto-assigned', className: 'bg-accent/20 text-primary' },
}

// A VPE's deliberate Override also lands on status 'auto' (see
// overrideRole in mockRolesStore.js), same as a genuine algorithmic
// auto-assign — isOverride is the only thing that tells them apart, so
// the VPE's own role board can show which of the two actually happened.
function getStatusBadge(entry) {
  if (entry.status === 'auto' && entry.isOverride) {
    return { text: 'Auto-assigned by VPE', className: 'bg-accent/20 text-primary' }
  }
  return statusLabels[entry.status]
}

// One tab-chip label/color per getRoleFillSummary phase — colors reuse
// tokens already meaningful elsewhere on this page (e.g. accent/15 +
// text-primary is the same pair as the role board's "Open" badge).
function tabChip({ phase, open, requiredOpen }, cancelled) {
  if (cancelled) return { text: 'Cancelled', className: 'bg-ink/10 text-ink/50' }
  switch (phase) {
    case 'finalized':
      return { text: 'Finalized', className: 'bg-primary/10 text-primary' }
    case 'finalized-incomplete':
      return { text: `Finalized · ${requiredOpen} open`, className: 'bg-red-50 text-red-700' }
    case 'ready-to-finalize':
      return { text: 'Ready to finalize', className: 'bg-primary/10 text-primary' }
    default:
      return { text: `${open} open`, className: 'bg-accent/15 text-primary' }
  }
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

export default function RoleManagementPage() {
  const [meetings, setMeetings] = useState([])
  const [activeMeetingId, setActiveMeetingId] = useState(null)
  const [notifications, setNotifications] = useState(() => getNotifications())
  const [roster, setRoster] = useState([])
  const [overrideTarget, setOverrideTarget] = useState(null)
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false)
  const [showAllNotifications, setShowAllNotifications] = useState(false)
  const [showCancelMeeting, setShowCancelMeeting] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [roleToAdd, setRoleToAdd] = useState('')
  const [customRoleName, setCustomRoleName] = useState('')

  const activeMeeting = meetings.find((m) => m.id === activeMeetingId)

  function refresh() {
    getMeetings().then((fetched) => {
      setMeetings(fetched)
      // Default to the next active (not cancelled, not yet happened)
      // meeting — not the first not-yet-finalized one, which can lag
      // behind real dates, and not a cancelled meeting even if it's
      // technically the chronologically-next row.
      const upcoming = findNextActiveMeeting(fetched)
      setActiveMeetingId(
        (prev) => prev ?? upcoming?.id ?? fetched[fetched.length - 1]?.id ?? null,
      )
    })
    setNotifications(getNotifications())
  }

  useEffect(() => {
    refresh()
    getMembers().then(setRoster)
  }, [])

  async function handleAutoAssign() {
    await autoAssignMeeting(activeMeetingId)
    refresh()
  }

  async function doFinalize() {
    await finalizeMeeting(activeMeetingId)
    setShowFinalizeConfirm(false)
    refresh()
  }

  // Only interrupt with a confirmation when there's something to actually
  // warn about — a fully-filled board finalizes immediately, same as
  // before. This is also what stops the "finalized an empty board"
  // mistake from happening silently again.
  function handleFinalizeClick() {
    const { open } = getRoleFillSummary(activeMeeting)
    if (open > 0) {
      setShowFinalizeConfirm(true)
      return
    }
    doFinalize()
  }

  async function handleUnfinalize() {
    if (!window.confirm('Members already saw these roles as final — unlock anyway?')) return
    await unfinalizeMeeting(activeMeetingId)
    refresh()
  }

  async function handleOverrideConfirm({ takenBy, takenByEmail }) {
    try {
      await overrideRole(activeMeetingId, overrideTarget.id, { takenBy, takenByEmail })
      setOverrideTarget(null)
      refresh()
    } catch (err) {
      window.alert(err.message)
    }
  }

  async function handleAddRole() {
    // A custom role's "id" is just the typed text itself — there's no
    // catalog entry to reference (see getMeetingRoleEntries), so the
    // display name and the role_id are the same string.
    const roleIdToAdd = roleToAdd === OTHER_ROLE_VALUE ? customRoleName.trim() : roleToAdd
    if (!roleIdToAdd) return
    try {
      await addMeetingRole(activeMeetingId, roleIdToAdd)
      setRoleToAdd('')
      setCustomRoleName('')
      refresh()
    } catch (err) {
      window.alert(err.message)
    }
  }

  async function handleRemoveRole(role) {
    const entry = activeMeeting.roles[role.id]
    // Only ask for confirmation if removing this would actually discard
    // a real assignment — an already-open, nobody-assigned role is
    // harmless to remove outright.
    if (
      entry.status !== 'open' &&
      !window.confirm(`Remove ${role.name}? ${entry.takenBy ? `${entry.takenBy}'s assignment will be lost.` : ''}`)
    ) {
      return
    }
    try {
      await removeMeetingRole(activeMeetingId, role.id)
      refresh()
    } catch (err) {
      window.alert(err.message)
    }
  }

  async function handleCancelConfirm(reason) {
    try {
      await cancelMeeting(activeMeetingId, reason)
      setShowCancelMeeting(false)
      refresh()
    } catch (err) {
      window.alert(err.message)
    }
  }

  async function handleUncancel() {
    try {
      await uncancelMeeting(activeMeetingId)
      refresh()
    } catch (err) {
      window.alert(err.message)
    }
  }

  async function handleRescheduleConfirm(newDate) {
    try {
      await rescheduleMeeting(activeMeetingId, newDate)
      setShowReschedule(false)
      refresh()
    } catch (err) {
      window.alert(err.message)
    }
  }

  if (!activeMeeting) {
    return (
      <MemberLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-ink/50">Loading meetings...</p>
        </div>
      </MemberLayout>
    )
  }

  // Only the next 3 upcoming meetings are manageable here — further-out
  // meetings are hidden entirely, since the sequential-finalize rule
  // below makes them un-actionable anyway until closer. Past meetings
  // stay visible for reference.
  const upcomingMeetings = meetings.filter((m) => (m.hoursUntilMeeting ?? -1) >= 0)
  const visibleMeetings = [
    ...meetings.filter((m) => (m.hoursUntilMeeting ?? -1) < 0),
    ...upcomingMeetings.slice(0, 3),
  ]

  // Uses the full meetings list, not visibleMeetings — "previous meeting"
  // must be the real chronological previous one, even if it's scrolled
  // out of this page's visible window.
  const canFinalize = canFinalizeMeeting(meetings, activeMeetingId)
  const { filled, open, total, requiredOpen, phase } = getRoleFillSummary(activeMeeting)
  const fillPercent = total > 0 ? Math.round((filled / total) * 100) : 0
  const isIncomplete = phase === 'finalized-incomplete'

  const visibleNotifications = showAllNotifications ? notifications : notifications.slice(0, 5)

  return (
    <MemberLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Role Management</h1>
        <p className="mt-1 text-sm text-ink/60">
          Manage role assignments for upcoming meetings.
        </p>

        {/* Meeting tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto">
          {visibleMeetings.map((m) => {
            const active = m.id === activeMeetingId
            const chip = tabChip(getRoleFillSummary(m), m.cancelled)
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMeetingId(m.id)}
                className={`shrink-0 rounded-2xl border px-4 py-2.5 text-left transition ${
                  active
                    ? 'border-primary bg-primary text-cream'
                    : 'border-accent/30 bg-white text-ink hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-semibold">{m.label}</p>
                <p className={`text-xs ${active ? 'text-cream/80' : 'text-ink/50'}`}>
                  {m.dateLabel}
                </p>
                <span
                  className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    active ? 'bg-white/20 text-cream' : chip.className
                  }`}
                >
                  {chip.text}
                </span>
              </button>
            )
          })}
        </div>

        {activeMeeting.cancelled ? (
          <div className="mt-6">
            <CancelledMeetingNotice
              dateLabel={activeMeeting.dateLabel}
              reason={activeMeeting.cancelReason}
              onUncancel={handleUncancel}
            />
          </div>
        ) : (
          <>
        {/* Status card — the one place that should tell the VPE
            everything: how full the board is, what phase it's in, and
            what to do next. */}
        <div
          className={`mt-6 rounded-3xl border p-6 ${
            isIncomplete ? 'border-red-200 bg-red-50' : 'border-accent/30 bg-white'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={`text-3xl font-extrabold ${isIncomplete ? 'text-red-700' : 'text-ink'}`}>
                {filled} of {total} roles filled
              </p>
              <div className="mt-2 h-2 w-48 max-w-full overflow-hidden rounded-full bg-cream">
                <div
                  className={`h-full rounded-full ${isIncomplete ? 'bg-red-400' : 'bg-primary'}`}
                  style={{ width: `${fillPercent}%` }}
                />
              </div>
              <p
                className={`mt-3 flex items-center gap-1.5 text-sm ${
                  isIncomplete ? 'font-medium text-red-700' : 'text-ink/60'
                }`}
              >
                {isIncomplete && <AlertTriangle size={15} className="shrink-0" />}
                {phase === 'self-select' &&
                  `Self-select open until ${activeMeeting.autoAssignCutoffLabel}. ${open} still open.`}
                {phase === 'past-cutoff' &&
                  `${open} roles still open, past the self-select cutoff.`}
                {phase === 'ready-to-finalize' &&
                  (open > 0
                    ? `Ready to finalize — ${open} speaker/evaluator role${open > 1 ? 's' : ''} still open.`
                    : 'All roles filled — ready to finalize.')}
                {phase === 'finalized' && 'Finalized — members have been notified.'}
                {isIncomplete &&
                  `Finalized with ${requiredOpen} required role${requiredOpen > 1 ? 's' : ''} still open — members may see their assignment as unavailable with no explanation.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(phase === 'self-select' || phase === 'past-cutoff') && (
                <button
                  type="button"
                  onClick={handleAutoAssign}
                  disabled={phase !== 'past-cutoff'}
                  className="flex items-center gap-2 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition enabled:hover:bg-primary enabled:hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Zap size={16} />
                  Trigger Auto-Assign Now
                </button>
              )}
              {phase === 'ready-to-finalize' && (
                <button
                  type="button"
                  onClick={handleFinalizeClick}
                  disabled={!canFinalize}
                  title={!canFinalize ? "The previous meeting hasn't happened yet" : undefined}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CheckCircle2 size={16} />
                  Finalize Roles
                </button>
              )}
              {(phase === 'finalized' || isIncomplete) && (
                <button
                  type="button"
                  onClick={handleUnfinalize}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    isIncomplete
                      ? 'border-red-300 text-red-700 hover:bg-red-100'
                      : 'border-accent/40 text-ink/70 hover:bg-cream'
                  }`}
                >
                  <LockOpen size={15} />
                  Unlock to Edit
                </button>
              )}
            </div>
          </div>

          {/* Secondary, rarer actions — available regardless of phase,
              since a meeting can need cancelling or moving at any point. */}
          <div className="mt-4 flex items-center gap-4 border-t border-accent/15 pt-4">
            <button
              type="button"
              onClick={() => setShowReschedule(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-ink"
            >
              <CalendarClock size={13} />
              Reschedule
            </button>
            <button
              type="button"
              onClick={() => setShowCancelMeeting(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
            >
              <CalendarX2 size={13} />
              Cancel Meeting
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Role board */}
            <div className="rounded-3xl border border-accent/30 bg-white p-6">
              <h2 className="text-sm font-semibold text-ink">
                {activeMeeting.dateLabel} Role Board
              </h2>

              <details className="mt-3 rounded-xl bg-cream px-3.5 py-2.5 text-ink/70">
                <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium">
                  <SlidersHorizontal size={13} className="text-primary" />
                  How auto-assign scores members
                </summary>
                <p className="mt-2 text-xs text-ink/60">
                  Attendance {Math.round(scoringWeights.attendance * 100)}% · Role recency{' '}
                  {Math.round(scoringWeights.roleRecency * 100)}% · Frequency{' '}
                  {Math.round(scoringWeights.frequency * 100)}%
                </p>
              </details>

              {/* Desktop table. overflow-x-auto on the wrapper + a fixed
                  layout with a capped/truncated Assigned To column — a
                  long name used to wrap onto a second line and grow
                  that row's height out of sync with every other row's
                  single-line height in the same table (and threw off
                  the mobile card layout the same way). Truncating with
                  an ellipsis keeps every row the same height; the
                  scrollable wrapper is the fallback for anything still
                  too wide on a narrow screen. */}
              <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-accent/20 sm:block">
                <table className="w-full table-fixed text-left text-sm">
                  <thead>
                    <tr className="border-b border-accent/20 bg-cream/60 text-xs uppercase tracking-wide text-ink/50">
                      <th className="w-[30%] px-4 py-2.5 font-semibold">Role</th>
                      <th className="w-[26%] px-4 py-2.5 font-semibold">Assigned To</th>
                      <th className="w-[20%] px-4 py-2.5 font-semibold">Status</th>
                      <th className="px-4 py-2.5 font-semibold" />
                    </tr>
                  </thead>
                  <tbody>
                    {getMeetingRoleEntries(activeMeeting.roles).map((role) => {
                      const entry = activeMeeting.roles[role.id]
                      const badge = getStatusBadge(entry)
                      return (
                        <tr
                          key={role.id}
                          className={`border-b border-accent/10 last:border-0 ${
                            entry.status === 'open' ? 'bg-accent/5' : ''
                          }`}
                        >
                          <td className="truncate px-4 py-2.5 font-medium text-ink" title={role.name}>
                            {role.name}
                            {VPE_ONLY_ROLE_IDS.includes(role.id) && (
                              <span className="ml-1.5 rounded-full bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold text-ink/50">
                                VPE only
                              </span>
                            )}
                          </td>
                          <td className="truncate px-4 py-2.5 text-ink/70" title={entry.takenBy ?? undefined}>
                            {entry.takenBy ?? '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
                              {badge.text}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => setOverrideTarget(role)}
                                disabled={activeMeeting.finalized}
                                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <PencilLine size={12} />
                                Override
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveRole(role)}
                                disabled={activeMeeting.finalized}
                                aria-label={`Remove ${role.name}`}
                                className="text-ink/30 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="mt-4 space-y-2.5 sm:hidden">
                {getMeetingRoleEntries(activeMeeting.roles).map((role) => {
                  const entry = activeMeeting.roles[role.id]
                  const badge = getStatusBadge(entry)
                  return (
                    <div
                      key={role.id}
                      className={`rounded-2xl border border-accent/20 p-3.5 ${
                        entry.status === 'open' ? 'bg-accent/5' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-ink">
                          {role.name}
                          {VPE_ONLY_ROLE_IDS.includes(role.id) && (
                            <span className="ml-1.5 rounded-full bg-ink/10 px-1.5 py-0.5 text-[10px] font-semibold text-ink/50">
                              VPE only
                            </span>
                          )}
                        </p>
                        <span className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                          {badge.text}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <p className="text-sm text-ink/60">{entry.takenBy ?? 'Unassigned'}</p>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setOverrideTarget(role)}
                            disabled={activeMeeting.finalized}
                            className="flex items-center gap-1 text-xs font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <PencilLine size={12} />
                            Override
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveRole(role)}
                            disabled={activeMeeting.finalized}
                            aria-label={`Remove ${role.name}`}
                            className="text-ink/30 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Add a role — any roleCatalog id not already on this
                  meeting (e.g. a 4th+ speaker/evaluator pair for a
                  speech-marathon meeting), or "Other…" for a one-off role
                  the catalog doesn't cover at all (a game/photo booth/
                  whatever) — the typed text becomes the role itself, no
                  catalog entry needed. Per-meeting only; every other
                  meeting is unaffected. */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <select
                  value={roleToAdd}
                  onChange={(e) => setRoleToAdd(e.target.value)}
                  disabled={activeMeeting.finalized}
                  className="rounded-lg border border-accent/40 bg-cream px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <option value="">Add a role…</option>
                  {roleCatalog
                    .filter((role) => !(role.id in activeMeeting.roles))
                    .map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  <option value={OTHER_ROLE_VALUE}>Other…</option>
                </select>
                {roleToAdd === OTHER_ROLE_VALUE && (
                  <input
                    type="text"
                    autoFocus
                    value={customRoleName}
                    onChange={(e) => setCustomRoleName(e.target.value)}
                    placeholder="Role name"
                    disabled={activeMeeting.finalized}
                    className="rounded-lg border border-accent/40 bg-cream px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
                  />
                )}
                <button
                  type="button"
                  onClick={handleAddRole}
                  disabled={
                    (roleToAdd === OTHER_ROLE_VALUE ? !customRoleName.trim() : !roleToAdd) ||
                    activeMeeting.finalized
                  }
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-accent/50 px-3 py-2 text-sm font-semibold text-ink/60 transition enabled:hover:border-primary enabled:hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Notifications log — lightened/secondary now that the status
              card carries the primary information. Still global (the
              underlying log has no per-meeting id, only a message
              string), so it's labeled as covering every meeting. */}
          <div className="rounded-3xl bg-cream/60 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Bell size={16} className="text-primary" />
              Notifications Log
            </div>
            <p className="text-xs text-ink/40">Across all meetings</p>
            {notifications.length > 0 ? (
              <>
                <ul className="mt-4 space-y-4">
                  {visibleNotifications.map((n) => (
                    <li key={n.id} className="border-l-2 border-accent/30 pl-3">
                      <p className="text-sm leading-snug text-ink/80">{n.message}</p>
                      <p className="mt-0.5 text-xs text-ink/40">{timeAgo(n.time)}</p>
                    </li>
                  ))}
                </ul>
                {!showAllNotifications && notifications.length > visibleNotifications.length && (
                  <button
                    type="button"
                    onClick={() => setShowAllNotifications(true)}
                    className="mt-3 text-xs font-semibold text-primary hover:underline"
                  >
                    View all ({notifications.length})
                  </button>
                )}
              </>
            ) : (
              <p className="mt-4 text-sm text-ink/50">No activity yet.</p>
            )}
          </div>
        </div>
          </>
        )}
      </div>

      {overrideTarget && (
        <RoleOverrideModal
          roleName={overrideTarget.name}
          currentAssignee={activeMeeting.roles[overrideTarget.id].takenBy}
          roster={roster}
          onClose={() => setOverrideTarget(null)}
          onConfirm={handleOverrideConfirm}
        />
      )}

      {showFinalizeConfirm && (
        <FinalizeConfirmModal
          openCount={open}
          meetingLabel={`${activeMeeting.label}, ${activeMeeting.dateLabel}`}
          onClose={() => setShowFinalizeConfirm(false)}
          onConfirm={doFinalize}
        />
      )}

      {showCancelMeeting && (
        <CancelMeetingModal
          meetingLabel={`${activeMeeting.label}, ${activeMeeting.dateLabel}`}
          onClose={() => setShowCancelMeeting(false)}
          onConfirm={handleCancelConfirm}
        />
      )}

      {showReschedule && (
        <RescheduleMeetingModal
          meetingLabel={`${activeMeeting.label}, ${activeMeeting.dateLabel}`}
          currentDate={activeMeeting.date}
          otherDates={meetings.filter((m) => m.id !== activeMeetingId).map((m) => m.date)}
          onClose={() => setShowReschedule(false)}
          onConfirm={handleRescheduleConfirm}
        />
      )}
    </MemberLayout>
  )
}
