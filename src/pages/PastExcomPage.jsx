import { Building2, GraduationCap, Mail, Phone, Sparkles } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import Avatar from '../components/Avatar.jsx'
import { pastExcom } from '../data/excom.js'

export default function PastExcomPage() {
  return (
    <MemberLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Past ExCom</h1>
        <p className="mt-1 text-sm text-ink/60">
          The members who've led the club before us. Contact info and extra
          details are shown only where the club has them on record.
        </p>

        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pastExcom.map((member) => {
            const hasDeptInfo = member.department || member.branch
            const hasContact = member.phone || member.email

            return (
              <div
                key={member.id}
                className="rounded-3xl border border-accent/30 bg-white p-5 shadow-sm shadow-primary/5"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} size={52} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{member.name}</p>
                    <p className="truncate text-sm font-medium text-primary">
                      {member.role}
                    </p>
                  </div>
                </div>

                {(hasDeptInfo || member.yearOfStudy) && (
                  <div className="mt-4 space-y-1.5 border-t border-accent/20 pt-4 text-xs text-ink/60">
                    {hasDeptInfo && (
                      <p className="flex items-center gap-1.5">
                        <Building2 size={13} className="shrink-0 text-primary" />
                        {[member.department, member.branch].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {member.yearOfStudy && (
                      <p className="flex items-center gap-1.5">
                        <GraduationCap size={13} className="shrink-0 text-primary" />
                        {member.yearOfStudy}
                      </p>
                    )}
                  </div>
                )}

                {member.contribution && (
                  <div className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-ink/60">
                    <Sparkles size={13} className="mt-0.5 shrink-0 text-primary" />
                    <p>{member.contribution}</p>
                  </div>
                )}

                {hasContact && (
                  <div className="mt-4 space-y-1.5 border-t border-accent/20 pt-4 text-xs text-ink/60">
                    {member.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone size={13} className="shrink-0 text-primary" />
                        {member.phone}
                      </p>
                    )}
                    {member.email && (
                      <p className="flex items-center gap-1.5">
                        <Mail size={13} className="shrink-0 text-primary" />
                        {member.email}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </MemberLayout>
  )
}
