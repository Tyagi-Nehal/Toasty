import { useEffect, useState } from 'react'
import { Bell, CheckCircle2, Lock, PencilLine, SlidersHorizontal, Zap } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import RoleOverrideModal from '../components/RoleOverrideModal.jsx'
import { roleCatalog } from '../data/roleCatalog.js'
import {
  autoAssignMeeting,
  finalizeMeeting,
  getMeetings,
  getNotifications,
  overrideRole,
} from '../lib/mockRolesStore.js'
import { scoringWeights } from '../lib/mockRosterStore.js'

const algorithmParams = [
  { label: 'Attendance weight', value: Math.round(scoringWeights.attendance * 100) },
  { label: 'Role recency weight', value: Math.round(scoringWeights.roleRecency * 100) },
  { label: 'Frequency weight', value: Math.round(scoringWeights.frequency * 100) },
  { label: 'Projects completed weight', value: null },
]

const statusLabels = {
  open: { text: 'Open', className: 'bg-accent/15 text-primary' },
  taken: { text: 'Self-selected', className: 'bg-cream text-ink/70' },
  auto: { text: 'Auto-assigned', className: 'bg-accent/20 text-primary' },
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
  const [overrideTarget, setOverrideTarget] = useState(null)

  const activeMeeting = meetings.find((m) => m.id === activeMeetingId)

  function refresh() {
    getMeetings().then((fetched) => {
      setMeetings(fetched)
      setActiveMeetingId((prev) => prev ?? fetched[0]?.id ?? null)
    })
    setNotifications(getNotifications())
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleAutoAssign() {
    await autoAssignMeeting(activeMeetingId)
    refresh()
  }

  async function handleFinalize() {
    await finalizeMeeting(activeMeetingId)
    refresh()
  }

  async function handleOverrideConfirm({ status, takenBy }) {
    await overrideRole(activeMeetingId, overrideTarget.id, { status, takenBy })
    setOverrideTarget(null)
    refresh()
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

  return (
    <MemberLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
              Role Management
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              Manage role assignments for upcoming meetings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoAssign}
              disabled={activeMeeting.finalized}
              className="flex items-center gap-2 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition enabled:hover:bg-primary enabled:hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Zap size={16} />
              Trigger Auto-Assign Now
            </button>
            {activeMeeting.finalized ? (
              <span className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary">
                <Lock size={15} />
                Finalized
              </span>
            ) : (
              <button
                type="button"
                onClick={handleFinalize}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
              >
                <CheckCircle2 size={16} />
                Finalize Roles
              </button>
            )}
          </div>
        </div>

        {/* Meeting tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto">
          {meetings.map((m) => {
            const active = m.id === activeMeetingId
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
                  {m.finalized ? ' · Finalized' : ''}
                </p>
              </button>
            )
          })}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Algorithm parameters */}
            <div className="rounded-3xl border border-accent/30 bg-white p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <SlidersHorizontal size={16} className="text-primary" />
                Auto-Assign Algorithm Parameters
              </div>
              <p className="mt-1 text-xs text-ink/50">
                Used by "Trigger Auto-Assign Now" to pick real members based on
                attendance and role history.
              </p>
              <div className="mt-4 space-y-3">
                {algorithmParams.map((param) => (
                  <div key={param.label}>
                    <div className="flex items-center justify-between text-xs text-ink/60">
                      <span>{param.label}</span>
                      <span className="font-medium text-ink">
                        {param.value === null ? 'No data source yet' : `${param.value}%`}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cream">
                      <div
                        className={`h-full rounded-full ${param.value === null ? 'bg-ink/15' : 'bg-primary'}`}
                        style={{ width: `${param.value ?? 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Role board */}
            <div className="rounded-3xl border border-accent/30 bg-white p-6">
              <h2 className="text-sm font-semibold text-ink">
                {activeMeeting.dateLabel} Role Board
              </h2>

              {/* Desktop table */}
              <div className="mt-4 hidden overflow-hidden rounded-2xl border border-accent/20 sm:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-accent/20 bg-cream/60 text-xs uppercase tracking-wide text-ink/50">
                      <th className="px-4 py-2.5 font-semibold">Role</th>
                      <th className="px-4 py-2.5 font-semibold">Assigned To</th>
                      <th className="px-4 py-2.5 font-semibold">Status</th>
                      <th className="px-4 py-2.5 font-semibold" />
                    </tr>
                  </thead>
                  <tbody>
                    {roleCatalog.map((role) => {
                      const entry = activeMeeting.roles[role.id]
                      const badge = statusLabels[entry.status]
                      return (
                        <tr key={role.id} className="border-b border-accent/10 last:border-0">
                          <td className="px-4 py-2.5 font-medium text-ink">{role.name}</td>
                          <td className="px-4 py-2.5 text-ink/70">{entry.takenBy ?? '—'}</td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
                              {badge.text}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => setOverrideTarget(role)}
                              disabled={activeMeeting.finalized}
                              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <PencilLine size={12} />
                              Override
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="mt-4 space-y-2.5 sm:hidden">
                {roleCatalog.map((role) => {
                  const entry = activeMeeting.roles[role.id]
                  const badge = statusLabels[entry.status]
                  return (
                    <div key={role.id} className="rounded-2xl border border-accent/20 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-ink">{role.name}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}>
                          {badge.text}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <p className="text-sm text-ink/60">{entry.takenBy ?? 'Unassigned'}</p>
                        <button
                          type="button"
                          onClick={() => setOverrideTarget(role)}
                          disabled={activeMeeting.finalized}
                          className="flex items-center gap-1 text-xs font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <PencilLine size={12} />
                          Override
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Notifications log */}
          <div className="rounded-3xl border border-accent/30 bg-white p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Bell size={16} className="text-primary" />
              Notifications Log
            </div>
            {notifications.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {notifications.map((n) => (
                  <li key={n.id} className="border-l-2 border-accent/30 pl-3">
                    <p className="text-sm leading-snug text-ink/80">{n.message}</p>
                    <p className="mt-0.5 text-xs text-ink/40">{timeAgo(n.time)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-ink/50">No activity yet.</p>
            )}
          </div>
        </div>
      </div>

      {overrideTarget && (
        <RoleOverrideModal
          roleName={overrideTarget.name}
          currentAssignee={activeMeeting.roles[overrideTarget.id].takenBy}
          currentStatus={activeMeeting.roles[overrideTarget.id].status}
          onClose={() => setOverrideTarget(null)}
          onConfirm={handleOverrideConfirm}
        />
      )}
    </MemberLayout>
  )
}
