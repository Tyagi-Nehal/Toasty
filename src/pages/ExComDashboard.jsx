import {
  Activity,
  CalendarDays,
  ClipboardCheck,
  FileEdit,
  FileText,
  ImagePlus,
  ListChecks,
  MessageSquare,
  Star,
  UserCheck2,
  UserCog,
  UsersRound,
  Vote,
  Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import MemberLayout from '../components/MemberLayout.jsx'
import Avatar from '../components/Avatar.jsx'
import { getAccount, getDisplayRole, hasExcomRole } from '../lib/mockAuth.js'
import {
  findNextActiveMeeting,
  getMeetings,
  getNotifications as getRoleNotifications,
} from '../lib/mockRolesStore.js'
import { getPendingSignups } from '../lib/mockMemberSignups.js'
import { getMembersWithStatus } from '../lib/mockMembershipStore.js'
import { getAgendaHistory } from '../lib/mockAgendaStore.js'
import { getVisitRequestsLog } from '../lib/mockVisitRequests.js'
import { getAllFeedback } from '../lib/mockFeedbackStore.js'
import { getMonthlyBreakdown, getMonthlyPoints } from '../lib/mockPointsStore.js'

// Phase 1 only covers automatic/measurable categories — discretionary
// awards, guest-approval points, and the monthly poll aren't scored yet,
// so President/Associate accounts will correctly show 0 here until those
// land.
const categoryLabels = {
  finalize_agenda: 'Finalized + agenda sent by Tuesday',
  no_repetition: 'No role repetition',
  external_booking: 'Booked an external guest',
  mom_on_time: 'MOM submitted on time',
  attendance_on_time: 'Attendance marked on time',
  on_time_start: 'Meeting started on time',
  photos_on_time: 'Photos submitted on time',
  new_member_registered: 'New members registered',
  growth_bonus: 'Club growth bonus',
  renewal_new_member: 'New-member renewals',
  renewal_existing_member: 'Existing-member renewals',
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

// Merges the app's real, name-driven activity logs (role selection/
// override/auto-assign/finalize, agenda edits/sends, visit requests) into
// one feed, newest first. Renewals/referral logs are excluded — those
// still run off the placeholder roster, a separate documented scope
// boundary, not genuinely real yet.
function getRecentActivity(limit = 6) {
  const combined = [...getRoleNotifications(), ...getAgendaHistory(), ...getVisitRequestsLog()]
  return combined.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, limit)
}

const quickActionsByRole = [
  {
    role: 'President',
    actions: [
      { to: '/register-excom', label: 'Register Your EXCOM', icon: UserCog },
    ],
  },
  {
    role: 'VPE',
    actions: [
      { to: '/agenda-editor', label: 'Edit Agenda', icon: FileEdit },
      { to: '/role-management', label: 'View Role Status', icon: ListChecks },
    ],
  },
  {
    role: 'Secretary',
    actions: [
      { to: '/attendance', label: 'Submit Attendance', icon: ClipboardCheck },
      { to: '/mom', label: 'Submit MOM', icon: FileText },
    ],
  },
  {
    role: 'SAA',
    actions: [{ to: '/poll-editor', label: 'Open Poll Editor', icon: Vote }],
  },
  {
    role: 'VPM',
    actions: [
      { to: '/approvals', label: 'View Pending Approvals', icon: UserCheck2 },
    ],
  },
  {
    role: 'Treasurer',
    actions: [
      { to: '/renewals', label: 'View Pending Renewals', icon: Wallet },
    ],
  },
  {
    role: 'VPPR',
    actions: [{ to: '/photo-upload', label: 'Upload Photos', icon: ImagePlus }],
  },
]

export default function ExComDashboard() {
  const account = getAccount()
  const [pendingSignupsCount, setPendingSignupsCount] = useState(0)
  const [upcomingMeeting, setUpcomingMeeting] = useState(null)
  const [recentActivity, setRecentActivity] = useState(() => getRecentActivity())
  const [members, setMembers] = useState([])
  const [pendingRenewalsCount, setPendingRenewalsCount] = useState(0)
  const [monthlyPoints, setMonthlyPoints] = useState(0)
  const [pointsBreakdown, setPointsBreakdown] = useState([])
  const canSeeMembers = hasExcomRole('VPM') || hasExcomRole('Treasurer')
  const displayRole = getDisplayRole(account)

  useEffect(() => {
    if (hasExcomRole('VPM')) {
      getPendingSignups().then((signups) => setPendingSignupsCount(signups.length))
    }
    getMeetings().then((meetings) => {
      const upcoming = findNextActiveMeeting(meetings)
      setUpcomingMeeting(upcoming ?? meetings[meetings.length - 1] ?? null)
    })
    if (canSeeMembers) {
      getMembersWithStatus().then((list) => {
        setMembers(list)
        setPendingRenewalsCount(list.filter((m) => m.paymentStatus !== 'paid').length)
      })
    }
    if (displayRole && account?.email) {
      getMonthlyPoints(displayRole, account.email).then(setMonthlyPoints)
      getMonthlyBreakdown(displayRole, account.email).then(setPointsBreakdown)
    }
  }, [])

  if (!account?.excomRoles?.length) {
    return <Navigate to="/dashboard" replace />
  }

  const firstName = account?.name?.split(' ')[0] ?? 'there'

  const roleEntries = upcomingMeeting ? Object.values(upcomingMeeting.roles) : []
  const filledRoles = roleEntries.filter((r) => r.status !== 'open').length
  const totalRoles = roleEntries.length

  const unreadFeedbackCount = getAllFeedback().filter((f) => !f.read).length

  const overviewCards = [
    {
      key: 'meeting',
      show: true,
      to: '/role-management',
      icon: CalendarDays,
      label: 'Upcoming Meeting',
      value: upcomingMeeting ? `${filledRoles}/${totalRoles} roles filled` : '—',
      sub: upcomingMeeting
        ? `${upcomingMeeting.dateLabel}${upcomingMeeting.time ? `, ${upcomingMeeting.time}` : ''}`
        : 'Loading...',
    },
    {
      key: 'renewals',
      show: hasExcomRole('Treasurer'),
      to: '/renewals',
      icon: Wallet,
      label: 'Pending Renewals',
      value: pendingRenewalsCount,
      sub: 'awaiting confirmation',
    },
    {
      key: 'approvals',
      show: hasExcomRole('VPM'),
      to: '/approvals',
      icon: UserCheck2,
      label: 'Pending Approvals',
      value: pendingSignupsCount,
      sub: 'new member requests',
    },
    {
      key: 'feedback',
      show: hasExcomRole('President'),
      to: '/feedback-inbox',
      icon: MessageSquare,
      label: 'Unread Feedback',
      value: unreadFeedbackCount,
      sub: 'in the inbox',
    },
  ].filter((c) => c.show)

  const visibleQuickActions = quickActionsByRole.filter((group) =>
    hasExcomRole(group.role),
  )

  return (
    <MemberLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          ExCom Dashboard
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Welcome back, {firstName}. Here's the club at a glance.
        </p>

        {/* Overview cards */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overviewCards.map(({ key, to, icon: Icon, label, value, sub }) => (
            <Link
              key={key}
              to={to}
              className="rounded-3xl border border-accent/30 bg-white p-5 transition hover:border-primary hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-primary">
                <Icon size={19} />
              </div>
              <p className="mt-3 text-2xl font-extrabold text-ink">{value}</p>
              <p className="text-sm font-medium text-ink/70">{label}</p>
              <p className="mt-0.5 text-xs text-ink/40">{sub}</p>
            </Link>
          ))}
        </div>

        {/* Points this month — Phase 1: automatic/measurable scoring
            only, so President/Associate accounts correctly show 0 until
            discretionary awards and the monthly poll land. */}
        {displayRole && (
          <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Star size={16} className="text-primary" />
                Points This Month
              </div>
              <span className="text-2xl font-extrabold text-primary">{monthlyPoints}</span>
            </div>
            {pointsBreakdown.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {pointsBreakdown.map((row) => (
                  <li key={row.category} className="flex items-center justify-between text-sm">
                    <span className="text-ink/60">{categoryLabels[row.category] ?? row.category}</span>
                    <span className="font-medium text-ink">+{row.points}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink/50">No points recorded yet this month.</p>
            )}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Quick actions */}
          <div className="space-y-6 lg:col-span-2">
            {visibleQuickActions.length > 0 && (
              <div className="rounded-3xl border border-accent/30 bg-white p-6">
                <h2 className="text-sm font-semibold text-ink">Quick Actions</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {visibleQuickActions.flatMap((group) => group.actions).map(
                    ({ to, label, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        className="flex items-center gap-3 rounded-2xl border border-accent/30 p-4 transition hover:border-primary hover:shadow-sm"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-primary">
                          <Icon size={17} />
                        </div>
                        <span className="text-sm font-semibold text-ink">
                          {label}
                        </span>
                      </Link>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="rounded-3xl border border-accent/30 bg-white p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Activity size={16} className="text-primary" />
              Recent Activity
            </div>
            {recentActivity.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {recentActivity.map((item) => (
                  <li key={item.id} className="border-l-2 border-accent/30 pl-3">
                    <p className="text-sm leading-snug text-ink/80">{item.message}</p>
                    <p className="mt-0.5 text-xs text-ink/40">{timeAgo(item.time)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-ink/50">No activity yet.</p>
            )}
          </div>
        </div>

        {/* Members list — visible to VPM/Treasurer (President included via
            the existing superuser rule in hasExcomRole). */}
        {canSeeMembers && (
          <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <UsersRound size={16} className="text-primary" />
              Members
            </div>
            {members.length > 0 ? (
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m) => (
                  <div
                    key={m.name}
                    className="flex items-center gap-2.5 rounded-2xl border border-accent/20 p-3"
                  >
                    <Avatar name={m.name} size={28} />
                    <span className="min-w-0 truncate text-sm font-medium text-ink">{m.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        m.isActive ? 'bg-primary/10 text-primary' : 'bg-ink/10 text-ink/50'
                      }`}
                    >
                      {m.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink/50">Loading members...</p>
            )}
          </div>
        )}
      </div>
    </MemberLayout>
  )
}
