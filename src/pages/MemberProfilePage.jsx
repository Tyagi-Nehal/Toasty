import { useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  ReceiptText,
  Star,
  UserCheck,
  UsersRound,
} from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import Avatar from '../components/Avatar.jsx'
import { getAccount } from '../lib/mockAuth.js'
import { getRenewalStatus, markPaymentDone } from '../lib/mockRenewalStore.js'
import { roleHistory, pointsBreakdown } from '../data/mockProfileData.js'
import { mentors } from '../data/mentors.js'

const categoryLabels = {
  roleCompletion: 'Role completion',
  attendance: 'Attendance',
  recognition: 'Recognition',
}

export default function MemberProfilePage() {
  const account = getAccount()
  const [renewal, setRenewal] = useState(getRenewalStatus())
  const [utrInput, setUtrInput] = useState('')
  const myMentor = mentors[0] ?? null

  function handlePaymentDone() {
    setRenewal(markPaymentDone(utrInput))
  }

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
              <p className="text-2xl font-extrabold text-ink">{pointsBreakdown.total}</p>
              <p className="text-xs text-ink/50">Total points</p>
            </div>
            <div className="rounded-2xl bg-cream p-4 text-center">
              <p className="text-2xl font-extrabold text-ink">
                {pointsBreakdown.thisMonth}
              </p>
              <p className="text-xs text-ink/50">This month</p>
            </div>
            <div className="col-span-2 rounded-2xl bg-cream p-4 text-center sm:col-span-1">
              <p className="text-2xl font-extrabold text-ink">
                {roleHistory.length}
              </p>
              <p className="text-xs text-ink/50">Roles completed</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {Object.entries(pointsBreakdown.byCategory).map(([key, value]) => {
              const pct = Math.round((value / pointsBreakdown.total) * 100)
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs text-ink/60">
                    <span>{categoryLabels[key] ?? key}</span>
                    <span className="font-medium text-ink">{value} pts</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Role history */}
        <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <CalendarDays size={16} className="text-primary" />
            Role History
          </div>

          {/* Desktop table */}
          <div className="mt-4 hidden overflow-hidden rounded-2xl border border-accent/20 sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-accent/20 bg-cream/60 text-xs uppercase tracking-wide text-ink/50">
                  <th className="px-4 py-2.5 font-semibold">Meeting</th>
                  <th className="px-4 py-2.5 font-semibold">Role</th>
                  <th className="px-4 py-2.5 font-semibold">Points</th>
                </tr>
              </thead>
              <tbody>
                {roleHistory.map((item) => (
                  <tr
                    key={`${item.meetingDate}-${item.role}`}
                    className="border-b border-accent/10 last:border-0"
                  >
                    <td className="px-4 py-2.5 text-ink/60">{item.meetingDate}</td>
                    <td className="px-4 py-2.5 font-medium text-ink">{item.role}</td>
                    <td className="px-4 py-2.5 text-primary">+{item.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="mt-4 space-y-2.5 sm:hidden">
            {roleHistory.map((item) => (
              <div
                key={`${item.meetingDate}-${item.role}`}
                className="rounded-2xl border border-accent/20 p-3.5"
              >
                <p className="text-xs text-ink/50">{item.meetingDate}</p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="font-medium text-ink">{item.role}</p>
                  <span className="text-sm font-semibold text-primary">
                    +{item.points}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Renewal status */}
        <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ReceiptText size={16} className="text-primary" />
            Renewal Status
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              {renewal.status === 'paid' ? (
                <p className="flex items-center gap-1.5 font-medium text-ink">
                  <CheckCircle2 size={16} className="text-primary" />
                  Fee paid: {renewal.paidThroughTerm}
                </p>
              ) : renewal.status === 'awaiting_confirmation' ? (
                <p className="flex items-center gap-1.5 font-medium text-ink/70">
                  <Clock size={16} className="text-primary" />
                  Payment submitted — awaiting Treasurer confirmation
                </p>
              ) : (
                <p className="font-medium text-ink/70">Renewal Pending</p>
              )}
            </div>

            {renewal.status === 'pending' && (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="UTR reference (optional)"
                  className="rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handlePaymentDone}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
                >
                  Payment Done
                </button>
              </div>
            )}
          </div>
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
