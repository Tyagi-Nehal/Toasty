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
  Users,
  History,
  FlaskConical,
  ClipboardCheck,
  FileText,
  FileEdit,
  BookOpen,
  Inbox,
  LayoutGrid,
  Vote,
  UserCheck2,
  Wallet,
  ImagePlus,
} from 'lucide-react'
import Logo from './Logo.jsx'
import Avatar from './Avatar.jsx'
import { getAccount, clearAccount, setExcomRoles, hasExcomRole } from '../lib/mockAuth.js'

const excomRoleOptions = [
  'Member',
  'President',
  'VPE',
  'Ass. VPE',
  'VPPR',
  'Ass. VPPR',
  'VPM',
  'Secretary',
  'Treasurer',
  'SAA',
]

const baseNavLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/roles', label: 'Roles', icon: ClipboardList },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/minutes', label: 'Minutes', icon: BookOpen },
  { to: '/photos', label: 'Photos', icon: Images },
  { to: '/mentors', label: 'Mentors', icon: Users },
  { to: '/past-excom', label: 'Past ExCom', icon: History },
]

const excomNavLinks = [
  { to: '/agenda-editor', label: 'Agenda Editor', icon: FileEdit, role: 'VPE' },
  { to: '/poll-editor', label: 'Poll Editor', icon: Vote, role: 'SAA' },
  { to: '/approvals', label: 'Approvals', icon: UserCheck2, role: 'VPM' },
  { to: '/renewals', label: 'Renewals', icon: Wallet, role: 'Treasurer' },
  { to: '/photo-upload', label: 'Photo Upload', icon: ImagePlus, role: 'VPPR' },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck, role: 'Secretary' },
  { to: '/mom', label: 'MOM', icon: FileText, role: 'Secretary' },
  { to: '/feedback-inbox', label: 'Feedback Inbox', icon: Inbox, role: 'President' },
]

export default function MemberLayout({ children, unreadCount = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false)
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

  function handleLogout() {
    clearAccount()
    navigate('/')
  }

  function handleRoleSwitch(e) {
    const value = e.target.value
    setExcomRoles(value === 'Member' ? [] : [value])
    window.location.reload()
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
            <Link
              to="/dashboard#notifications"
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink/60 transition hover:bg-white hover:text-primary"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-cream">
                  {unreadCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-white"
              >
                <Avatar name={account?.name ?? 'Member'} size={32} />
                <span className="hidden text-sm font-medium text-ink sm:block">
                  {account?.name?.split(' ')[0] ?? 'Member'}
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

                    <div className="mt-1 border-t border-accent/20 px-3 pb-1 pt-2">
                      <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink/40">
                        <FlaskConical size={11} />
                        Prototype: view as
                      </p>
                      <select
                        value={account?.excomRoles?.[0] ?? 'Member'}
                        onChange={handleRoleSwitch}
                        className="mt-1.5 w-full rounded-lg border border-accent/30 bg-cream px-2 py-1.5 text-xs text-ink focus:border-primary focus:outline-none"
                      >
                        {excomRoleOptions.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
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
