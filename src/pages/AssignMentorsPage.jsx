import { useEffect, useState } from 'react'
import { GraduationCap, UsersRound } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import Avatar from '../components/Avatar.jsx'
import { getRosterWithMentors, assignMentor } from '../lib/mockRosterStore.js'
import { getMentors } from '../lib/mockMentorsStore.js'
import { getAccount } from '../lib/mockAuth.js'

const NO_MENTOR_VALUE = ''

const selectClass =
  'w-full max-w-xs rounded-lg border border-accent/40 bg-cream px-2.5 py-1.5 text-sm text-ink focus:border-primary focus:outline-none'

// VPE pairs each roster member up with one of the club's real mentors
// (club_mentors, managed by the VPPR on the Photo Upload page) — every
// member's own profile then shows their actual assigned mentor instead
// of the same placeholder for everyone. Saves each row immediately on
// change (no separate "Save" step — a single dropdown per row doesn't
// need staging, unlike Renewal Management's multi-field rows).
export default function AssignMentorsPage() {
  const [members, setMembers] = useState([])
  const [mentors, setMentors] = useState([])
  const [savingEmail, setSavingEmail] = useState(null)

  function refresh() {
    const clubId = getAccount()?.clubId
    getRosterWithMentors(clubId).then(setMembers)
    getMentors(clubId).then(setMentors)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleChange(member, mentorIdRaw) {
    const mentorId = mentorIdRaw === NO_MENTOR_VALUE ? null : Number(mentorIdRaw)
    setSavingEmail(member.email)
    const mentor = mentors.find((m) => m.id === mentorId)
    setMembers((prev) =>
      prev.map((m) =>
        m.email === member.email ? { ...m, mentorId, mentorName: mentor?.name ?? null } : m,
      ),
    )
    try {
      await assignMentor(member.email, mentorId, getAccount()?.clubId)
    } catch (err) {
      window.alert(err.message)
      refresh()
    } finally {
      setSavingEmail(null)
    }
  }

  return (
    <MemberLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2">
          <GraduationCap size={22} className="text-primary" />
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Assign Mentors</h1>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          Pair each member with one of the club's mentors — they'll see this on their
          own profile under "My Mentor".
        </p>

        {mentors.length === 0 ? (
          <div className="mt-7 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-accent/40 bg-white p-10 text-center">
            <UsersRound size={28} className="text-ink/30" />
            <p className="text-sm text-ink/50">
              No mentors added yet — ask the VPPR to add some first, from Photo Upload
              → Mentors.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-accent/30 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[440px] text-left text-sm">
                <thead>
                  <tr className="border-b border-accent/20 bg-cream/60 text-xs uppercase tracking-wide text-ink/50">
                    <th className="px-4 py-3 font-semibold">Member</th>
                    <th className="px-4 py-3 font-semibold">Mentor</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.email} className="border-b border-accent/10 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={member.name} size={28} />
                          <span className="font-medium text-ink">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={member.mentorId ?? NO_MENTOR_VALUE}
                          onChange={(e) => handleChange(member, e.target.value)}
                          disabled={savingEmail === member.email}
                          className={selectClass}
                        >
                          <option value={NO_MENTOR_VALUE}>No mentor</option>
                          {mentors.map((mentor) => (
                            <option key={mentor.id} value={mentor.id}>
                              {mentor.name}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-sm text-ink/50">
                        No members on the roster yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MemberLayout>
  )
}
