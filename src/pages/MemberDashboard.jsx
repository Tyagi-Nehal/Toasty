import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  TrendingUp,
  CalendarDays,
  Check,
  X,
  ArrowRight,
  CheckCircle2,
  Bell,
} from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import DeclineRoleModal from '../components/DeclineRoleModal.jsx'
import { getAccount } from '../lib/mockAuth.js'
import { roleCatalog } from '../data/roleCatalog.js'
import {
  VPE_ONLY_ROLE_IDS,
  acceptAutoAssignedRole,
  declineMyRole,
  findNextActiveMeeting,
  getMeetings,
} from '../lib/mockRolesStore.js'
import { getMyMembershipStatus } from '../lib/mockMembershipStore.js'
import { getNotifications, markAllRead } from '../lib/mockNotificationsStore.js'
import { notificationIcons, defaultNotificationIcon } from '../components/notificationMeta.js'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
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

export default function MemberDashboard() {
  const account = getAccount()
  const firstName = account?.name?.split(' ')[0] ?? 'there'
  const location = useLocation()

  const [meetings, setMeetings] = useState([])
  const [loadingMeeting, setLoadingMeeting] = useState(true)
  const [isDeclineOpen, setIsDeclineOpen] = useState(false)
  const [notifications, setNotifications] = useState(() => getNotifications())
  const [membership, setMembership] = useState(null)

  function refresh() {
    getMeetings().then((fetched) => {
      setMeetings(fetched)
      setLoadingMeeting(false)
    })
  }

  useEffect(() => {
    refresh()
    getMyMembershipStatus().then(setMembership)
  }, [])

  useEffect(() => {
    if (location.hash === '#notifications') {
      document.getElementById('notifications')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  function handleMarkAllRead() {
    markAllRead()
    setNotifications(getNotifications())
  }

  const upcoming = findNextActiveMeeting(meetings)
  const myRole = upcoming?.myRoleId ? roleCatalog.find((r) => r.id === upcoming.myRoleId) : null
  const myRoleEntry = upcoming?.myRoleId ? upcoming.roles[upcoming.myRoleId] : null
  const isVpeOnlyRole = upcoming?.myRoleId ? VPE_ONLY_ROLE_IDS.includes(upcoming.myRoleId) : false

  async function handleAccept() {
    try {
      await acceptAutoAssignedRole(upcoming.id)
      refresh()
    } catch (err) {
      window.alert(err.message)
    }
  }

  async function handleDeclineConfirm() {
    try {
      await declineMyRole(upcoming.id)
      refresh()
      setIsDeclineOpen(false)
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <MemberLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            Hi {firstName}!
          </h1>
          {membership && (
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                membership.isActive ? 'bg-primary/10 text-primary' : 'bg-ink/10 text-ink/50'
              }`}
            >
              {membership.isActive ? 'Active' : 'Inactive'}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-ink/60">
          Here's what's happening in your club this week.
        </p>
        {membership && (
          <p className="mt-1 text-xs text-ink/50">
            {membership.isActive
              ? `Membership active until ${formatDate(membership.membershipEnd)}`
              : membership.membershipEnd
                ? `Membership expired ${formatDate(membership.membershipEnd)} — contact the Treasurer to renew.`
                : 'No membership on file yet — contact the Treasurer.'}
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Points card */}
            <div className="rounded-3xl border border-accent/30 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink/60">My points this month</p>
                  <p className="text-3xl font-extrabold text-ink">
                    0<span className="ml-1 text-base font-medium text-ink/40">pts</span>
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-primary">
                  <TrendingUp size={22} />
                </div>
              </div>
              <p className="mt-3 text-xs text-ink/50">Points tracking is coming soon.</p>
            </div>

            {/* Upcoming meeting card */}
            <div className="rounded-3xl border border-accent/30 bg-white p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <CalendarDays size={16} />
                Upcoming Meeting
              </div>

              {loadingMeeting ? (
                <p className="mt-3 text-sm text-ink/50">Loading...</p>
              ) : !upcoming ? (
                <p className="mt-3 text-sm text-ink/50">No upcoming meeting scheduled yet.</p>
              ) : (
                <>
                  <p className="mt-2 text-lg font-bold text-ink">
                    {upcoming.dateLabel}
                    {upcoming.time ? `, ${upcoming.time}` : ''}
                  </p>

                  <div className="mt-4 rounded-2xl bg-cream p-4">
                    {!myRole ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-ink/60">My Role</p>
                          <p className="font-semibold text-ink/50">
                            {upcoming.pastCutoff
                              ? 'No role assigned for this meeting'
                              : 'Please select a role for the next meeting'}
                          </p>
                        </div>
                        <Link
                          to="/roles"
                          className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
                        >
                          Select a Role
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-ink/60">My Role</p>
                          <p className="font-semibold text-ink">{myRole.name}</p>
                          {myRoleEntry.status === 'auto' && (
                            <p className="mt-1 text-xs font-medium text-primary">
                              {isVpeOnlyRole
                                ? 'Assigned by the VPE'
                                : `Auto-assigned${myRoleEntry.acceptedAt ? ' · Confirmed' : ' · Awaiting your response'}`}
                            </p>
                          )}
                        </div>
                        {!isVpeOnlyRole &&
                          myRoleEntry.status === 'auto' &&
                          !myRoleEntry.acceptedAt &&
                          (membership && !membership.isActive ? (
                            <p className="text-xs font-medium text-ink/50">
                              Your membership is inactive — contact the Treasurer to renew.
                            </p>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleAccept}
                                className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
                              >
                                <Check size={15} />
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsDeclineOpen(true)}
                                className="flex items-center gap-1.5 rounded-full border border-accent/50 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:bg-white"
                              >
                                <X size={15} />
                                Decline
                              </button>
                            </div>
                          ))}
                        {!isVpeOnlyRole && myRoleEntry.status === 'auto' && myRoleEntry.acceptedAt && (
                          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                            <CheckCircle2 size={14} />
                            You're all set
                          </span>
                        )}
                        {!isVpeOnlyRole &&
                          myRoleEntry.status === 'taken' &&
                          (membership && !membership.isActive ? (
                            <p className="text-xs font-medium text-ink/50">
                              Your membership is inactive — contact the Treasurer to renew.
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsDeclineOpen(true)}
                              className="flex items-center gap-1.5 rounded-full border border-accent/50 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:bg-white"
                            >
                              <X size={15} />
                              Decline
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notifications panel */}
          <div
            id="notifications"
            className="scroll-mt-24 rounded-3xl border border-accent/30 bg-white p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Bell size={16} className="text-primary" />
                Notifications
              </div>
              {notifications.some((n) => !n.read) && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <ul className="mt-4 space-y-3">
              {notifications.map((n) => {
                const Icon = notificationIcons[n.type] ?? defaultNotificationIcon
                const Wrapper = n.link ? Link : 'div'
                return (
                  <li key={n.id}>
                    <Wrapper
                      {...(n.link ? { to: n.link } : {})}
                      className={`flex gap-3 ${n.link ? 'rounded-xl transition hover:bg-cream' : ''}`}
                    >
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          n.read ? 'bg-cream text-ink/40' : 'bg-accent/20 text-primary'
                        }`}
                      >
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={`text-sm leading-snug ${
                            n.read ? 'text-ink/60' : 'font-medium text-ink'
                          }`}
                        >
                          {n.message}
                        </p>
                        <p className="mt-0.5 text-xs text-ink/40">{timeAgo(n.time)}</p>
                      </div>
                    </Wrapper>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      {isDeclineOpen && myRole && upcoming && (
        <DeclineRoleModal
          roleName={myRole.name}
          meetingLabel={`${upcoming.dateLabel}, ${upcoming.time}`}
          hoursUntilMeeting={upcoming.hoursUntilMeeting ?? 999}
          onClose={() => setIsDeclineOpen(false)}
          onConfirm={handleDeclineConfirm}
        />
      )}
    </MemberLayout>
  )
}
