import { useState } from 'react'
import {
  UserCheck2,
  Check,
  X,
  Inbox,
  Users,
  Gift,
  History,
  Mail,
  CalendarDays,
  HeartHandshake,
  Phone,
  CalendarClock,
} from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import Avatar from '../components/Avatar.jsx'
import {
  getPendingApprovals,
  getApprovedMembers,
  approveMember,
  rejectMember,
  getReferralMembers,
  recordGuestAttended,
  recordGuestConverted,
  getApprovalsLog,
} from '../lib/mockApprovalsStore.js'
import { acknowledgeVisitRequest, getVisitRequests } from '../lib/mockVisitRequests.js'

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

export default function NewMemberApprovalsPage() {
  const [pending, setPending] = useState(() => getPendingApprovals())
  const [approved, setApproved] = useState(() => getApprovedMembers())
  const [log, setLog] = useState(() => getApprovalsLog())
  const [visitRequests, setVisitRequests] = useState(() => getVisitRequests())
  const referralMembers = getReferralMembers()
  const [referralMember, setReferralMember] = useState(referralMembers[0])
  const [referralFeedback, setReferralFeedback] = useState(null)

  function refresh() {
    setPending(getPendingApprovals())
    setApproved(getApprovedMembers())
    setLog(getApprovalsLog())
    setVisitRequests(getVisitRequests())
  }

  function handleAcknowledgeVisit(id) {
    acknowledgeVisitRequest(id)
    refresh()
  }

  function handleApprove(id) {
    approveMember(id)
    refresh()
  }

  function handleReject(id) {
    rejectMember(id)
    refresh()
  }

  function handleGuestAttended() {
    recordGuestAttended(referralMember)
    setReferralFeedback(`${referralMember} awarded +6 points for their guest attending.`)
    refresh()
  }

  function handleGuestConverted() {
    recordGuestConverted(referralMember)
    setReferralFeedback(
      `${referralMember} awarded +8 points, VPM awarded +10 points — guest converted to member.`,
    )
    refresh()
  }

  return (
    <MemberLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2">
          <UserCheck2 size={22} className="text-primary" />
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            New Member Approvals
          </h1>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          Review pending signup requests, visit requests, and manage
          referral points.
        </p>

        {/* Visit requests */}
        <div className="mt-7">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <HeartHandshake size={16} className="text-primary" />
            Visit Requests{' '}
            {visitRequests.filter((r) => r.status === 'pending').length > 0 &&
              `(${visitRequests.filter((r) => r.status === 'pending').length})`}
          </h2>

          {visitRequests.length > 0 ? (
            <div className="mt-3 space-y-3">
              {visitRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-accent/30 bg-white p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={request.name} size={40} />
                      <div>
                        <p className="font-semibold text-ink">{request.name}</p>
                        <p className="text-xs text-ink/50">
                          Interested in visiting {request.clubName}
                        </p>
                      </div>
                    </div>
                    {request.status === 'acknowledged' ? (
                      <span className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                        <Check size={13} />
                        Acknowledged
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAcknowledgeVisit(request.id)}
                        className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
                      >
                        <Check size={14} />
                        Acknowledge
                      </button>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-accent/20 pt-3 text-xs text-ink/60 sm:grid-cols-4">
                    <span className="flex items-center gap-1.5">
                      <Mail size={12} className="shrink-0 text-primary" />
                      {request.email}
                    </span>
                    {request.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone size={12} className="shrink-0 text-primary" />
                        {request.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <CalendarClock size={12} className="shrink-0 text-primary" />
                      Visiting {request.visitDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={12} className="shrink-0 text-primary" />
                      Submitted {new Date(request.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {request.message && (
                    <p className="mt-3 text-sm text-ink/70">{request.message}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-accent/40 bg-white p-8 text-center">
              <Inbox size={24} className="text-ink/30" />
              <p className="text-sm text-ink/50">No visit requests yet.</p>
            </div>
          )}
        </div>

        {/* Pending requests */}
        <div className="mt-7">
          <h2 className="text-sm font-semibold text-ink">
            Pending Requests {pending.length > 0 && `(${pending.length})`}
          </h2>

          {pending.length > 0 ? (
            <div className="mt-3 space-y-3">
              {pending.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent/30 bg-white p-4 sm:p-5"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={request.name} size={40} />
                    <div>
                      <p className="font-semibold text-ink">{request.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink/50">
                        <span className="flex items-center gap-1">
                          <Mail size={11} />
                          {request.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays size={11} />
                          {request.dateRequested}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleReject(request.id)}
                      className="flex items-center gap-1.5 rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-ink/70 transition hover:bg-cream"
                    >
                      <X size={14} />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(request.id)}
                      className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
                    >
                      <Check size={14} />
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-accent/40 bg-white p-8 text-center">
              <Inbox size={24} className="text-ink/30" />
              <p className="text-sm text-ink/50">No pending requests.</p>
            </div>
          )}
        </div>

        {/* Approved members */}
        <div className="mt-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Users size={16} className="text-primary" />
            Approved Members {approved.length > 0 && `(${approved.length})`}
          </h2>
          {approved.length > 0 ? (
            <div className="mt-3 space-y-2">
              {approved.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-white px-4 py-3"
                >
                  <Avatar name={member.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{member.name}</p>
                    <p className="truncate text-xs text-ink/50">{member.email}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    Approved
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink/50">
              No members approved through this page yet.
            </p>
          )}
        </div>

        {/* Referral points */}
        <div className="mt-8 rounded-3xl border border-accent/30 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Gift size={16} className="text-primary" />
            Referral Points
          </div>
          <p className="mt-1 text-xs text-ink/50">
            Award points when a member's guest attends a meeting or converts
            to a full member.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={referralMember}
              onChange={(e) => setReferralMember(e.target.value)}
              className="rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            >
              {referralMembers.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleGuestAttended}
              className="rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-cream"
            >
              Guest attended (+6)
            </button>
            <button
              type="button"
              onClick={handleGuestConverted}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
            >
              Guest converted to member (+8 / +10 VPM)
            </button>
          </div>

          {referralFeedback && (
            <p className="mt-3 text-sm font-medium text-primary">{referralFeedback}</p>
          )}
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
