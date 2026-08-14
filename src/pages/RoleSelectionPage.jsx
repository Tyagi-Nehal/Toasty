import { useEffect, useState } from 'react'
import { CheckCircle2, X, Lock, CircleDot, ShieldCheck } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import DeclineRoleModal from '../components/DeclineRoleModal.jsx'
import CancelledMeetingNotice from '../components/CancelledMeetingNotice.jsx'
import { roleCatalog } from '../data/roleCatalog.js'
import {
  VPE_ONLY_ROLE_IDS,
  declineMyRole,
  findNextActiveMeeting,
  getMeetings,
  selectRole,
} from '../lib/mockRolesStore.js'
import { getMyMembershipStatus } from '../lib/mockMembershipStore.js'

function StatusBadge({ role, roleId, isMine }) {
  if (isMine) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        <CheckCircle2 size={13} />
        Your role
      </span>
    )
  }
  if (role.status === 'open' && VPE_ONLY_ROLE_IDS.includes(roleId)) {
    return (
      <span className="flex items-center gap-1 rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold text-ink/50">
        <ShieldCheck size={13} />
        Assigned by VPE
      </span>
    )
  }
  if (role.status === 'open') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-primary">
        <CircleDot size={13} />
        Open
      </span>
    )
  }
  if (role.status === 'auto') {
    return (
      <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-primary">
        Auto-assigned to {role.takenBy}
      </span>
    )
  }
  return (
    <span className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-ink/50">
      Taken by {role.takenBy}
    </span>
  )
}

export default function RoleSelectionPage() {
  const [meetings, setMeetings] = useState([])
  const [activeMeetingId, setActiveMeetingId] = useState(null)
  const [isDeclineOpen, setIsDeclineOpen] = useState(false)
  const [membership, setMembership] = useState(null)

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
  }

  useEffect(() => {
    refresh()
    getMyMembershipStatus().then(setMembership)
  }, [])

  const isActiveMember = membership?.isActive === true

  const activeMeeting = meetings.find((m) => m.id === activeMeetingId)

  // Only the next 3 upcoming meetings are selectable — further-out
  // meetings are hidden entirely rather than shown-but-locked, to keep
  // this page focused on what members can actually act on right now.
  // Past meetings stay visible for reference.
  const upcomingMeetings = meetings.filter((m) => (m.hoursUntilMeeting ?? -1) >= 0)
  const visibleMeetings = [
    ...meetings.filter((m) => (m.hoursUntilMeeting ?? -1) < 0),
    ...upcomingMeetings.slice(0, 3),
  ]

  if (!activeMeeting) {
    return (
      <MemberLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-ink/50">Loading meetings...</p>
        </div>
      </MemberLayout>
    )
  }

  const myRole = activeMeeting.myRoleId
    ? roleCatalog.find((r) => r.id === activeMeeting.myRoleId)
    : null
  const myRoleEntry = activeMeeting.myRoleId
    ? activeMeeting.roles[activeMeeting.myRoleId]
    : null

  async function handleSelectRole(roleId) {
    try {
      await selectRole(activeMeetingId, roleId)
      refresh()
    } catch (err) {
      window.alert(err.message)
    }
  }

  async function handleDeclineConfirm() {
    try {
      await declineMyRole(activeMeetingId)
      refresh()
      setIsDeclineOpen(false)
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <MemberLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          Select Your Role
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Pick a role for one of the upcoming meetings.
        </p>

        {/* Meeting tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto">
          {visibleMeetings.map((m) => {
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
                  {m.cancelled ? ' · Cancelled' : ''}
                </p>
              </button>
            )
          })}
        </div>

        {activeMeeting.cancelled && (
          <div className="mt-6">
            <CancelledMeetingNotice
              dateLabel={activeMeeting.dateLabel}
              reason={activeMeeting.cancelReason}
            />
          </div>
        )}

        {!activeMeeting.cancelled && membership && !membership.isActive && (
          <div className="mt-6 rounded-2xl bg-cream p-4 text-sm text-ink/60">
            Your membership is inactive — contact the Treasurer to renew. You can
            still view roles, but selecting or declining is turned off until then.
          </div>
        )}

        {!activeMeeting.cancelled && (
        <>
        {/* My role card */}
        {myRole && (
          <div className="mt-6 rounded-3xl border border-primary/30 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {myRoleEntry.status === 'auto' ? 'Auto-assigned' : 'Self-selected'}
                </p>
                <p className="mt-1 text-lg font-bold text-ink">{myRole.name}</p>
                <p className="text-sm text-ink/60">{myRole.description}</p>
              </div>
              {VPE_ONLY_ROLE_IDS.includes(activeMeeting.myRoleId) ? (
                <p className="flex items-center gap-1.5 text-xs text-ink/40">
                  <ShieldCheck size={13} />
                  Managed by the VPE
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDeclineOpen(true)}
                  disabled={activeMeeting.finalized || !isActiveMember}
                  title={
                    activeMeeting.finalized
                      ? 'Roles for this meeting are finalized — ask the VPE to unlock it'
                      : !isActiveMember
                        ? 'Your membership is inactive — contact the Treasurer to renew'
                        : undefined
                  }
                  className="flex items-center gap-1.5 rounded-full border border-accent/50 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X size={15} />
                  Decline Role
                </button>
              )}
            </div>
          </div>
        )}

        {/* Role list */}
        <div className="mt-6 space-y-3">
          {roleCatalog.map((role) => {
            const entry = activeMeeting.roles[role.id]
            const isVpeOnly = VPE_ONLY_ROLE_IDS.includes(role.id)
            const canSelect =
              entry.status === 'open' &&
              !isVpeOnly &&
              !activeMeeting.myRoleId &&
              !activeMeeting.finalized &&
              isActiveMember
            const isMine = activeMeeting.myRoleId === role.id

            return (
              <div
                key={role.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 ${
                  isMine ? 'border-primary/40' : 'border-accent/25'
                }`}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{role.name}</p>
                  <p className="text-sm text-ink/60">{role.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge role={entry} roleId={role.id} isMine={isMine} />
                  {canSelect && (
                    <button
                      type="button"
                      onClick={() => handleSelectRole(role.id)}
                      className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-cream shadow-sm shadow-primary/20 transition hover:bg-primary-dark"
                    >
                      Select this Role
                    </button>
                  )}
                  {!canSelect && entry.status === 'open' && !isMine && !isVpeOnly && (
                    <span
                      className="flex items-center gap-1 text-xs text-ink/40"
                      title={
                        activeMeeting.finalized
                          ? 'Roles for this meeting are finalized'
                          : !isActiveMember
                            ? 'Your membership is inactive'
                            : 'You already have a role for this meeting'
                      }
                    >
                      <Lock size={12} />
                      Unavailable
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        </>
        )}
      </div>

      {isDeclineOpen && myRole && (
        <DeclineRoleModal
          roleName={myRole.name}
          meetingLabel={`${activeMeeting.dateLabel}, ${activeMeeting.time}`}
          hoursUntilMeeting={activeMeeting.hoursUntilMeeting ?? 999}
          onClose={() => setIsDeclineOpen(false)}
          onConfirm={handleDeclineConfirm}
        />
      )}
    </MemberLayout>
  )
}
