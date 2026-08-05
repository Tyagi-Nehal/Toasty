import { useState } from 'react'
import { Wallet, Check, History, Hash, CalendarDays } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import Avatar from '../components/Avatar.jsx'
import {
  getRenewalRoster,
  confirmRenewal,
  getRenewalLog,
  CURRENT_TERM,
} from '../lib/mockRenewalManagementStore.js'

const filters = ['All', 'Paid', 'Pending', 'Overdue']

const statusBadge = {
  Paid: 'bg-primary/10 text-primary',
  Pending: 'bg-accent/20 text-ink/60',
  Overdue: 'bg-red-100 text-red-700',
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

export default function RenewalManagementPage() {
  const [roster, setRoster] = useState(() => getRenewalRoster())
  const [log, setLog] = useState(() => getRenewalLog())
  const [filter, setFilter] = useState('All')

  function refresh() {
    setRoster(getRenewalRoster())
    setLog(getRenewalLog())
  }

  function handleConfirm(id) {
    confirmRenewal(id)
    refresh()
  }

  const visible = filter === 'All' ? roster : roster.filter((r) => r.status === filter)

  return (
    <MemberLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2">
          <Wallet size={22} className="text-primary" />
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            Renewal Management
          </h1>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          Confirm membership renewals for the {CURRENT_TERM} term.
        </p>

        {/* Filter */}
        <div className="mt-5 flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === f
                  ? 'bg-primary text-cream'
                  : 'border border-accent/30 bg-white text-ink/70 hover:border-primary/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-accent/30 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-accent/20 bg-cream/60 text-xs uppercase tracking-wide text-ink/50">
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date Claimed</th>
                  <th className="px-4 py-3 font-semibold">UTR Reference</th>
                  <th className="px-4 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {visible.map((member) => (
                  <tr key={member.id} className="border-b border-accent/10 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={member.name} size={28} />
                        <span className="font-medium text-ink">
                          {member.name}
                          {member.isMe && (
                            <span className="ml-1.5 text-xs font-normal text-ink/40">(you)</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge[member.status]}`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink/60">
                      {member.dateClaimed ? (
                        <span className="flex items-center gap-1">
                          <CalendarDays size={12} />
                          {member.dateClaimed}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink/60">
                      {member.utr ? (
                        <span className="flex items-center gap-1">
                          <Hash size={12} />
                          {member.utr}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {member.status !== 'Paid' && member.dateClaimed && (
                        <button
                          type="button"
                          onClick={() => handleConfirm(member.id)}
                          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <Check size={12} />
                          Confirm Renewal
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink/50">
                      No members with this status.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity log */}
        <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <History size={16} className="text-primary" />
            Activity Log
          </div>
          {log.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {log.map((entry) => (
                <li key={entry.id} className="border-l-2 border-accent/30 pl-3">
                  <p className="text-sm leading-snug text-ink/80">{entry.message}</p>
                  <p className="mt-0.5 text-xs text-ink/40">{timeAgo(entry.time)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink/50">No activity yet.</p>
          )}
        </div>
      </div>
    </MemberLayout>
  )
}
