import { useEffect, useState } from 'react'
import { Award, UsersRound } from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar.jsx'
import Footer from '../components/Footer.jsx'
import Avatar from '../components/Avatar.jsx'
import { getMentors } from '../lib/mockMentorsStore.js'

// Public — reachable from the club page's navbar without signing in.
// No real per-club routing here yet (same as ExcomPage.jsx/
// PastExcomPage.jsx), so getMentors() is called unfiltered — a Phase 3
// item once /mentors gets a real :clubId route.
export default function MentorPage() {
  const [mentors, setMentors] = useState([])

  useEffect(() => {
    getMentors().then(setMentors)
  }, [])

  return (
    <div className="min-h-screen bg-cream">
      <PublicNavbar showMemberPageLinks />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Mentors</h1>
        <p className="mt-1 text-sm text-ink/60">
          Experienced Toastmasters volunteering their time to guide our members.
        </p>

        {mentors.length > 0 ? (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((mentor) => (
              <div
                key={mentor.id}
                className="rounded-3xl border border-accent/30 bg-white p-5 shadow-sm shadow-primary/5"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={mentor.name} size={52} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{mentor.name}</p>
                    {mentor.clubName && (
                      <p className="truncate text-sm text-ink/60">{mentor.clubName}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-accent/20 pt-4 text-xs text-ink/60">
                  {mentor.experience && (
                    <p className="flex items-center gap-1.5">
                      <Award size={13} className="shrink-0 text-primary" />
                      {mentor.experience}
                    </p>
                  )}
                  {mentor.achievements && (
                    <p className="leading-relaxed">{mentor.achievements}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-accent/40 bg-white p-10 text-center">
            <UsersRound size={28} className="text-ink/30" />
            <p className="text-sm text-ink/50">
              No mentors added yet. Check back soon!
            </p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
