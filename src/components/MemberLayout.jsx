import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Images,
  ClipboardCheck,
  FileText,
  BookOpen,
  Inbox,
  LayoutGrid,
  Vote,
  UserCheck2,
  ImagePlus,
} from 'lucide-react'
import Logo from './Logo.jsx'
import Avatar from './Avatar.jsx'
import { getAccount, hasExcomRole, getDisplayRole } from '../lib/mockAuth.js'
import { supabase } from '../lib/supabaseClient.js'
import { getNotifications, markAllRead } from '../lib/mockNotificationsStore.js'
import { notificationIcons, defaultNotificationIcon } from './notificationMeta.js'

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

const baseNavLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/roles', label: 'Roles', icon: ClipboardList },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/minutes', label: 'Minutes', icon: BookOpen },
  { to: '/photos', label: 'Photos', icon: Images },
]

const excomNavLinks = [
  { to: '/poll-editor', label: 'Poll Editor', icon: Vote, role: 'SAA' },
  { to: '/approvals', label: 'Approvals', icon: UserCheck2, role: 'VPM' },
  { to: '/photo-upload', label: 'Photo Upload', icon: ImagePlus, role: 'VPPR' },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck, role: 'Secretary' },
  { to: '/mom', label: 'MOM', icon: FileText, role: 'Secretary' },
  { to: '/feedback-inbox', label: 'Feedback Inbox', icon: Inbox, role: 'President' },
]

export default function MemberLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState(() => getNotifications())
  const unreadCount = notifications.filter((n) => !n.read).length
  const navigate = useNavigate()
  const location = useLocation()
  const account = getAccount()
  const isExcomMember = (account?.excomRoles?.length ?? 0) > 0
  const navLinks = [
    ...baseNavLinks,
    ...(isExcomMember
      ? [{ to: '/excom-dashboard', label: 'ExCom', icon: LayoutGrid }]
      : []),
    ...excomNavLinks.filter((link) => hasExcomRole(link.role)),
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  function toggleNotifications() {
    if (!notifOpen) setNotifications(getNotifications())
    setNotifOpen((v) => !v)
  }

  function handleMarkAllRead() {
    markAllRead()
    setNotifications(getNotifications())
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-40 border-b border-accent/30 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo />

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-primary text-cream'
                      : 'text-ink/60 hover:bg-white hover:text-ink'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={toggleNotifications}
                aria-label="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink/60 transition hover:bg-white hover:text-primary"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-cream">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-80 rounded-2xl border border-accent/30 bg-white p-2 shadow-lg">
                    <div className="flex items-center justify-between px-2.5 py-1.5">
                      <p className="text-sm font-semibold text-ink">Notifications</p>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.slice(0, 8).map((n) => {
                          const Icon = notificationIcons[n.type] ?? defaultNotificationIcon
                          const Wrapper = n.link ? Link : 'div'
                          return (
                            <Wrapper
                              key={n.id}
                              {...(n.link ? { to: n.link, onClick: () => setNotifOpen(false) } : {})}
                              className="flex gap-2.5 rounded-xl px-2.5 py-2 text-left transition hover:bg-cream"
                            >
                              <div
                                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                  n.read ? 'bg-cream text-ink/40' : 'bg-accent/20 text-primary'
                                }`}
                              >
                                <Icon size={13} />
                              </div>
                              <div className="min-w-0">
                                <p
                                  className={`text-xs leading-snug ${
                                    n.read ? 'text-ink/60' : 'font-medium text-ink'
                                  }`}
                                >
                                  {n.message}
                                </p>
                                <p className="mt-0.5 text-[11px] text-ink/40">{timeAgo(n.time)}</p>
                              </div>
                            </Wrapper>
                          )
                        })
                      ) : (
                        <p className="px-2.5 py-4 text-center text-sm text-ink/50">
                          No notifications yet.
                        </p>
                      )}
                    </div>
                    <Link
                      to="/dashboard#notifications"
                      onClick={() => setNotifOpen(false)}
                      className="mt-1 block rounded-lg px-2.5 py-2 text-center text-xs font-semibold text-primary hover:bg-cream"
                    >
                      View all on Dashboard
                    </Link>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Account menu"
                className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-white"
              >
                <Avatar name={account?.name ?? 'Member'} size={32} />
                <span className="hidden items-center gap-1.5 sm:flex">
                  <span className="text-sm font-medium text-ink">
                    {account?.name?.split(' ')[0] ?? 'Member'}
                  </span>
                  {isExcomMember && (
                    <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      {getDisplayRole(account)}
                    </span>
                  )}
                </span>
                <ChevronDown size={14} className="text-ink/40" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-accent/30 bg-white p-1.5 shadow-lg">
                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-cream"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/feedback"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-cream"
                    >
                      Feedback
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={14} />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto border-t border-accent/20 px-4 py-2 md:hidden">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'bg-primary text-cream'
                    : 'text-ink/60 hover:bg-white hover:text-ink'
                }`}
              >
                <Icon size={14} />
                {label}
              </Link>
            )
          })}
        </nav>
      </header>

      <main>{children}</main>
    </div>
  )
}
