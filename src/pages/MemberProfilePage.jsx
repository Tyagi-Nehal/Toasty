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
import { getAccount, getDisplayRole } from '../lib/mockAuth.js'
import { getRosterStatusForEmail, getMyMentor } from '../lib/mockRosterStore.js'
import { getRoleHistoryForEmail } from '../lib/mockRolesStore.js'
import {
  getMemberPointsSummary,
  getMonthlyPoints,
  getMonthlyBreakdown,
  getMemberPointsLedger,
  getExcomPointsLedger,
} from '../lib/mockPointsStore.js'
import PointsHistory from '../components/PointsHistory.jsx'
import { roleCatalog } from '../data/roleCatalog.js'

// Real member_points categories only. Phase 1: role_decline penalty,
// referral bonuses. Phase 2 added the three routine categories below —
// attending, completing an assigned role, and self-selecting one early
// — see scoreMeetingAttendance/scoreRoleCompletions/scoreRoleSelfSelect
// in mockPointsStore.js.
const categoryLabels = {
  role_decline: 'Role declines',
  guest_attended: 'Guest attended a meeting',
  guest_converted: 'Guest converted to member',
  meeting_attended: 'Attended a meeting',
  role_completed: 'Completed a role',
  role_self_selected: 'Self-selected a role early',
}

// excom_points categories — a separate pool from member_points above,
// earned only while actually holding an ExCom role (see
// mockPointsStore.js).
const excomCategoryLabels = {
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
  feedback_resolved: 'Resolved feedback within 48h',
  guest_converted_bonus: 'Referred guest became a member',
  meeting_presided: 'Presided over the meeting',
  excom_attendance: 'Attended the meeting',
}

const categoryRules = {
  meeting_attended: '+5 for every meeting you are marked present at.',
  role_completed: '+10 for holding a filled role when the VPE finalizes that meeting.',
  role_self_selected: '+5 bonus for picking a role yourself before the auto-assign cutoff.',
  guest_attended: '+6 when a guest you invited attends a meeting.',
  guest_converted: '+8 when a guest you invited becomes a member.',
  role_decline:
    'Penalty for declining a role: -2 with 24-48h notice, -4 with under 24h (free with 48h+).',
}

const excomCategoryRules = {
  finalize_agenda: '+18 when the agenda is sent and the meeting finalized by Tuesday of its week.',
  no_repetition: '+2 when every filled role went to a different person.',
  external_booking: '+5 for booking an outside guest into a role (max 4 a month).',
  mom_on_time: '+10 for submitting the minutes within 48h of the meeting.',
  attendance_on_time: '+10 for submitting attendance within 48h of the meeting.',
  on_time_start: '+20 when the meeting started at or before its scheduled time.',
  photos_on_time: 'Up to +20 per meeting for uploading photos within 48h (max 80 a month).',
  new_member_registered: '+80 for approving a new member signup (first one each month).',
  guest_converted_bonus: '+10 when a member-referred guest becomes a member.',
  growth_bonus: '+5 shared bonus the first time the club grows in a month.',
  renewal_new_member: '+15 for a first-ever renewal (max 3 a month).',
  renewal_existing_member: '+20 for a repeat renewal (max 4 a month).',
  feedback_resolved: '+20 for resolving a Feedback Inbox item within 48h (max 4 a month).',
  meeting_presided: '+20 for presiding over a meeting as PO.',
  excom_attendance: '+10 baseline for attending a meeting as VPM or Treasurer.',
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
  const [myMentor, setMyMentor] = useState(null)
  const [excomMonthlyPoints, setExcomMonthlyPoints] = useState(0)
  const [excomPointsBreakdown, setExcomPointsBreakdown] = useState([])
  const [memberLedger, setMemberLedger] = useState([])
  const [excomLedger, setExcomLedger] = useState([])
  const isExcomMember = (account?.excomRoles?.length ?? 0) > 0
  // Points are always stored under the base role label ('VPPR'), never
  // 'Ass. VPPR' — same reasoning as ExComDashboard.jsx.
  const excomPointsRole = getDisplayRole(account)?.replace(/^Ass\. /, '') ?? null

  useEffect(() => {
    if (account?.email) {
      getRosterStatusForEmail(account.email).then(setRenewal)
      getRoleHistoryForEmail(account.email, account.name).then(setRoleHistory)
      getMemberPointsSummary(account.email).then(setPoints)
      getMemberPointsLedger(account.email).then(setMemberLedger)
      getExcomPointsLedger(account.email, account.clubId).then(setExcomLedger)
    }
    if (account?.email) getMyMentor(account.email).then(setMyMentor)
    if (excomPointsRole && account?.email) {
      getMonthlyPoints(excomPointsRole, account.email, account.clubId).then(setExcomMonthlyPoints)
      getMonthlyBreakdown(excomPointsRole, account.email, account.clubId).then(setExcomPointsBreakdown)
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

        {/* ExCom points — a separate pool from member points below,
            earned only while actually holding an ExCom role. Shown as
            its own card, never merged into the member total, same split
            as the ExCom Dashboard's two point cards. */}
        {isExcomMember && (
          <div className="mt-8 rounded-3xl border border-accent/30 bg-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Star size={16} className="text-primary" />
                ExCom Points This Month
              </div>
              <span className="text-2xl font-extrabold text-primary">{excomMonthlyPoints}</span>
            </div>
            {excomPointsBreakdown.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {excomPointsBreakdown.map((row) => (
                  <li key={row.category} className="flex items-center justify-between text-sm">
                    <span className="text-ink/60">
                      {excomCategoryLabels[row.category] ?? row.category}
                    </span>
                    <span className="font-medium text-ink">+{row.points}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink/50">No ExCom points recorded yet this month.</p>
            )}
          </div>
        )}

        {/* Member points breakdown — separate from ExCom points above */}
        <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Star size={16} className="text-primary" />
            Member Points Breakdown
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

        <PointsHistory
          title="Member Points History"
          rows={memberLedger}
          labels={categoryLabels}
          rules={categoryRules}
        />
        {(isExcomMember || excomLedger.length > 0) && (
          <PointsHistory
            title="ExCom Points History"
            rows={excomLedger}
            labels={excomCategoryLabels}
            rules={excomCategoryRules}
            showRole
          />
        )}

        {/* Role history — real assignments from the live role board (points
            for completing/self-selecting them show in the breakdown above
            instead, keyed by meeting, not surfaced per-row here). */}
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
                {myMentor.achievements && (
                  <p className="text-xs text-ink/60">{myMentor.achievements}</p>
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
