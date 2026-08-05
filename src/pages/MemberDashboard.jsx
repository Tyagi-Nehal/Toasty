import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  TrendingUp,
  CalendarDays,
  Check,
  X,
  ArrowRight,
  UserCheck,
  FileText,
  Vote,
  CreditCard,
  CheckCircle2,
  Images,
  Users,
  ClipboardList,
  Bell,
} from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import DeclineRoleModal from '../components/DeclineRoleModal.jsx'
import { getAccount } from '../lib/mockAuth.js'
import { memberStats, upcomingMeeting, notifications } from '../data/mockMemberData.js'

const notificationIcons = {
  role_assigned: UserCheck,
  agenda_updated: FileText,
  poll_released: Vote,
  renewal_confirmed: CreditCard,
  account_approved: CheckCircle2,
}

const notificationLinks = {
  role_assigned: '/roles',
  agenda_updated: '/agenda',
  poll_released: '/poll',
}

const quickLinks = [
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/photos', label: 'Photo Memories', icon: Images },
  { to: '/mentors', label: 'Mentor Page', icon: Users },
]

export default function MemberDashboard() {
  const account = getAccount()
  const firstName = account?.name?.split(' ')[0] ?? 'there'
  const location = useLocation()

  const [roleStatus, setRoleStatus] = useState('pending') // 'pending' | 'confirmed' | 'declined'
  const [isDeclineOpen, setIsDeclineOpen] = useState(false)

  useEffect(() => {
    if (location.hash === '#notifications') {
      document.getElementById('notifications')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  const unreadCount = notifications.filter((n) => !n.read).length
  const progressPct = Math.min(
    100,
    Math.round((memberStats.pointsThisMonth / memberStats.topScore) * 100),
  )

  function handleDeclineConfirm() {
    setRoleStatus('declined')
    setIsDeclineOpen(false)
  }

  return (
    <MemberLayout unreadCount={unreadCount}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
          Hi {firstName}!
        </h1>
        <p className="mt-1 text-sm text-ink/60">
          Here's what's happening in your club this week.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Points card */}
            <div className="rounded-3xl border border-accent/30 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink/60">My points this month</p>
                  <p className="text-3xl font-extrabold text-ink">
                    {memberStats.pointsThisMonth}
                    <span className="ml-1 text-base font-medium text-ink/40">pts</span>
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/20 text-primary">
                  <TrendingUp size={22} />
                </div>
              </div>

              <div className="mt-4">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-cream">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-ink/50">
                  Rank #{memberStats.rank} of {memberStats.totalMembers} members
                  this month
                </p>
              </div>
            </div>

            {/* Upcoming meeting card */}
            <div className="rounded-3xl border border-accent/30 bg-white p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <CalendarDays size={16} />
                Upcoming Meeting
              </div>
              <p className="mt-2 text-lg font-bold text-ink">
                {upcomingMeeting.dateLabel}, {upcomingMeeting.time}
              </p>

              <div className="mt-4 rounded-2xl bg-cream p-4">
                {roleStatus === 'declined' ? (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-ink/60">My Role</p>
                      <p className="font-semibold text-ink/50 line-through">
                        {upcomingMeeting.role}
                      </p>
                      <p className="mt-1 text-xs font-medium text-red-600">
                        Declined
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
                ) : upcomingMeeting.role ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-ink/60">My Role</p>
                      <p className="font-semibold text-ink">{upcomingMeeting.role}</p>
                      {upcomingMeeting.assignmentType === 'auto' && (
                        <p className="mt-1 text-xs font-medium text-primary">
                          Auto-assigned
                          {roleStatus === 'confirmed' ? ' · Confirmed' : ' · Awaiting your response'}
                        </p>
                      )}
                    </div>
                    {upcomingMeeting.assignmentType === 'auto' &&
                      roleStatus === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setRoleStatus('confirmed')}
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
                      )}
                    {roleStatus === 'confirmed' && (
                      <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                        <CheckCircle2 size={14} />
                        You're all set
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-ink/60">My Role</p>
                      <p className="font-semibold text-ink/50">No role selected yet</p>
                    </div>
                    <Link
                      to="/roles"
                      className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
                    >
                      Select a Role
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {quickLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-white p-4 transition hover:border-primary hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-primary">
                    <Icon size={18} />
                  </div>
                  <span className="text-sm font-semibold text-ink">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Notifications panel */}
          <div
            id="notifications"
            className="scroll-mt-24 rounded-3xl border border-accent/30 bg-white p-6"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Bell size={16} className="text-primary" />
              Notifications
            </div>
            <ul className="mt-4 space-y-3">
              {notifications.map((n) => {
                const Icon = notificationIcons[n.type] ?? ClipboardList
                const link = notificationLinks[n.type]
                const Wrapper = link ? Link : 'div'
                return (
                  <li key={n.id}>
                    <Wrapper
                      {...(link ? { to: link } : {})}
                      className={`flex gap-3 ${link ? 'rounded-xl transition hover:bg-cream' : ''}`}
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
                        <p className="mt-0.5 text-xs text-ink/40">{n.time}</p>
                      </div>
                    </Wrapper>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      {isDeclineOpen && (
        <DeclineRoleModal
          roleName={upcomingMeeting.role}
          meetingLabel={`${upcomingMeeting.dateLabel}, ${upcomingMeeting.time}`}
          hoursUntilMeeting={upcomingMeeting.hoursUntilMeeting}
          onClose={() => setIsDeclineOpen(false)}
          onConfirm={handleDeclineConfirm}
        />
      )}
    </MemberLayout>
  )
}
