import {
  Activity,
  CalendarDays,
  ClipboardCheck,
  FileEdit,
  FileText,
  ImagePlus,
  ListChecks,
  MessageSquare,
  UserCheck2,
  UserCog,
  Vote,
  Wallet,
} from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import MemberLayout from '../components/MemberLayout.jsx'
import { getAccount, hasExcomRole } from '../lib/mockAuth.js'
import { getMeetings } from '../lib/mockRolesStore.js'
import { getPendingApprovals } from '../lib/mockApprovalsStore.js'
import { getRenewalRoster } from '../lib/mockRenewalManagementStore.js'
import { activityFeed } from '../data/mockActivityFeed.js'
import { getAllFeedback } from '../lib/mockFeedbackStore.js'

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

  if (!account?.excomRoles?.length) {
    return <Navigate to="/dashboard" replace />
  }

  const firstName = account?.name?.split(' ')[0] ?? 'there'

  const upcomingMeeting = getMeetings()[0]
  const roleEntries = Object.values(upcomingMeeting.roles)
  const filledRoles = roleEntries.filter((r) => r.status !== 'open').length
  const totalRoles = roleEntries.length

  const pendingRenewalsCount = getRenewalRoster().filter((r) => r.status !== 'Paid').length
  const unreadFeedbackCount = getAllFeedback().filter((f) => !f.read).length

  const overviewCards = [
    {
      key: 'meeting',
      show: true,
      to: '/role-management',
      icon: CalendarDays,
      label: 'Upcoming Meeting',
      value: `${filledRoles}/${totalRoles} roles filled`,
      sub: upcomingMeeting.dateLabel,
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
      value: getPendingApprovals().length,
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
            <ul className="mt-4 space-y-4">
              {activityFeed.map((item) => (
                <li key={item.id} className="border-l-2 border-accent/30 pl-3">
                  <p className="text-sm leading-snug text-ink/80">{item.message}</p>
                  <p className="mt-0.5 text-xs text-ink/40">{item.time}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </MemberLayout>
  )
}
