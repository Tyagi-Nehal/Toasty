import { useEffect, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Mail,
  ReceiptText,
  Star,
  UserCheck,
  UsersRound,
} from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import Avatar from '../components/Avatar.jsx'
import { getAccount } from '../lib/mockAuth.js'
import { getRosterStatusForEmail } from '../lib/mockRosterStore.js'
import { getRoleHistoryForEmail } from '../lib/mockRolesStore.js'
import { getMemberPointsSummary } from '../lib/mockPointsStore.js'
import { roleCatalog } from '../data/roleCatalog.js'
import { mentors } from '../data/mentors.js'

// Real member_points categories only (Phase 1: role_decline penalty,
// referral bonuses) — "Role completion"/"Attendance"/"Recognition" from
// the old mock data aren't things a member actually earns points for
// yet, so this page no longer implies they are.
const categoryLabels = {
  role_decline: 'Role declines',
  guest_attended: 'Guest attended a meeting',
  guest_converted: 'Guest converted to member',
}

const paymentStatusLabel = { paid: 'Paid', pending: 'Pending', overdue: 'Overdue' }

function formatMeetingDate(dateStr) {
  if (!dateStr) return ''
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

function roleDisplayName(roleId) {
  return roleCatalog.find((r) => r.id === roleId)?.name ?? roleId
}

export default function MemberProfilePage() {
  const account = getAccount()
  const [renewal, setRenewal] = useState(null)
  const [roleHistory, setRoleHistory] = useState([])
  const [points, setPoints] = useState({ total: 0, thisMonth: 0, byCategory: [] })
  const myMentor = mentors[0] ?? null

  useEffect(() => {
    if (account?.email) {
      getRosterStatusForEmail(account.email).then(setRenewal)
      getRoleHistoryForEmail(account.email, account.name).then(setRoleHistory)
      getMemberPointsSummary(account.email).then(setPoints)
    }
  }, [])

  return (
    <MemberLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Identity */}
        <div className="flex items-center gap-4">
          <Avatar name={account?.name ?? 'Member'} size={64} />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold text-ink sm:text-3xl">
              {account?.name ?? 'Member'}
            </h1>
            <p className="flex items-center gap-1.5 text-sm text-ink/60">
              <Mail size={13} />
              {account?.email ?? '—'}
            </p>
          </div>
        </div>

        {/* Points breakdown */}
        <div className="mt-8 rounded-3xl border border-accent/30 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Star size={16} className="text-primary" />
            Points Breakdown
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-cream p-4 text-center">
              <p className="text-2xl font-extrabold text-ink">{points.total}</p>
              <p className="text-xs text-ink/50">Total points</p>
            </div>
            <div className="rounded-2xl bg-cream p-4 text-center">
              <p className="text-2xl font-extrabold text-ink">{points.thisMonth}</p>
              <p className="text-xs text-ink/50">This month</p>
            </div>
            <div className="col-span-2 rounded-2xl bg-cream p-4 text-center sm:col-span-1">
              <p className="text-2xl font-extrabold text-ink">{roleHistory.length}</p>
              <p className="text-xs text-ink/50">Roles held</p>
            </div>
          </div>

          {points.byCategory.length > 0 ? (
            <div className="mt-5 space-y-2.5">
              {points.byCategory.map(({ category, points: value }) => (
                <div
                  key={category}
                  className="flex items-center justify-between rounded-xl bg-cream/60 px-4 py-2.5 text-sm"
                >
                  <span className="text-ink/70">{categoryLabels[category] ?? category}</span>
                  <span className={`font-semibold ${value < 0 ? 'text-red-600' : 'text-primary'}`}>
                    {value > 0 ? '+' : ''}
                    {value} pts
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-ink/50">No points recorded yet.</p>
          )}
        </div>

        {/* Role history — real assignments from the live role board, not
            per-role points (regular members don't currently earn points
            for holding a role — see getMemberPointsSummary above). */}
        <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <CalendarDays size={16} className="text-primary" />
            Role History
          </div>

          {roleHistory.length > 0 ? (
            <>
              {/* Desktop table */}
              <div className="mt-4 hidden overflow-hidden rounded-2xl border border-accent/20 sm:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-accent/20 bg-cream/60 text-xs uppercase tracking-wide text-ink/50">
                      <th className="px-4 py-2.5 font-semibold">Meeting</th>
                      <th className="px-4 py-2.5 font-semibold">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleHistory.map((item) => (
                      <tr
                        key={`${item.meetingDate}-${item.roleId}`}
                        className="border-b border-accent/10 last:border-0"
                      >
                        <td className="px-4 py-2.5 text-ink/60">
                          {item.meetingLabel} — {formatMeetingDate(item.meetingDate)}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-ink">
                          {roleDisplayName(item.roleId)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="mt-4 space-y-2.5 sm:hidden">
                {roleHistory.map((item) => (
                  <div
                    key={`${item.meetingDate}-${item.roleId}`}
                    className="rounded-2xl border border-accent/20 p-3.5"
                  >
                    <p className="text-xs text-ink/50">
                      {item.meetingLabel} — {formatMeetingDate(item.meetingDate)}
                    </p>
                    <p className="mt-1 font-medium text-ink">{roleDisplayName(item.roleId)}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-ink/50">No roles held yet.</p>
          )}
        </div>

        {/* Renewal status — read-only, the Treasurer is the only one who
            can change any of this (Renewal Management page). */}
        <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ReceiptText size={16} className="text-primary" />
            Renewal Status
          </div>

          {!renewal ? (
            <p className="mt-4 text-sm text-ink/50">Loading...</p>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  renewal.paymentStatus === 'paid'
                    ? 'bg-primary/10 text-primary'
                    : renewal.paymentStatus === 'overdue'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-accent/20 text-ink/60'
                }`}
              >
                {renewal.paymentStatus === 'paid' && <CheckCircle2 size={13} />}
                {paymentStatusLabel[renewal.paymentStatus]}
              </span>
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  renewal.isActive ? 'bg-primary/10 text-primary' : 'bg-ink/10 text-ink/50'
                }`}
              >
                {renewal.isActive ? 'Active' : 'Inactive'}
              </span>
              {renewal.membershipStart && renewal.membershipEnd && (
                <span className="text-sm text-ink/60">
                  {renewal.membershipStart} – {renewal.membershipEnd}
                </span>
              )}
            </div>
          )}
        </div>

        {/* My mentor */}
        <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <UserCheck size={16} className="text-primary" />
            My Mentor
          </div>

          {myMentor ? (
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={myMentor.name} size={44} />
              <div>
                <p className="font-semibold text-ink">{myMentor.name}</p>
                {(myMentor.email || myMentor.phone) && (
                  <p className="text-xs text-ink/60">
                    {myMentor.email ?? myMentor.phone}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-accent/40 p-4 text-sm text-ink/50">
              <UsersRound size={18} className="text-ink/30" />
              No mentor assigned yet.
            </div>
          )}
        </div>
      </div>
    </MemberLayout>
  )
}
