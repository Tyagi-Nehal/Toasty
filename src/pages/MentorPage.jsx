import { Award, Briefcase, Building2, Mail, Phone, UsersRound } from 'lucide-react'
import PublicNavbar from '../components/PublicNavbar.jsx'
import Footer from '../components/Footer.jsx'
import Avatar from '../components/Avatar.jsx'
import { mentors } from '../data/mentors.js'

// Public — reachable from the club page's navbar without signing in.
export default function MentorPage() {
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
                    {mentor.designation && (
                      <p className="truncate text-sm text-ink/60">
                        {mentor.designation}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 border-t border-accent/20 pt-4 text-xs text-ink/60">
                  {mentor.clubName && (
                    <p className="flex items-center gap-1.5">
                      <Building2 size={13} className="shrink-0 text-primary" />
                      {mentor.clubName}
                    </p>
                  )}
                  {mentor.experience && (
                    <p className="flex items-center gap-1.5">
                      <Award size={13} className="shrink-0 text-primary" />
                      {mentor.experience}
                    </p>
                  )}
                  {mentor.organization && (
                    <p className="flex items-center gap-1.5">
                      <Briefcase size={13} className="shrink-0 text-primary" />
                      {mentor.organization}
                    </p>
                  )}
                </div>

                {(mentor.email || mentor.phone) && (
                  <a
                    href={mentor.email ? `mailto:${mentor.email}` : `tel:${mentor.phone}`}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
                  >
                    {mentor.email ? <Mail size={15} /> : <Phone size={15} />}
                    Contact Mentor
                  </a>
                )}
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
