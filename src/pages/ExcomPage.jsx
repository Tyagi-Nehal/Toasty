import { useEffect, useState } from 'react'
import { Mail, Phone } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import Avatar from '../components/Avatar.jsx'
import { currentExcom } from '../data/excom.js'
import { getExcomProfiles } from '../lib/mockPhotoStore.js'

export default function ExcomPage() {
  const [profiles, setProfiles] = useState({})

  useEffect(() => {
    getExcomProfiles().then(setProfiles)
  }, [])

  return (
    <MemberLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Meet Our ExCom</h1>
        <p className="mt-1 text-sm text-ink/60">
          The current executive committee running the club this term.
        </p>

        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {currentExcom.map((member) => {
            const profile = profiles[member.id]
            const hasContact = profile?.phone || profile?.email

            return (
              <div
                key={member.id}
                className="rounded-3xl border border-accent/30 bg-white p-5 shadow-sm shadow-primary/5"
              >
                <div className="flex items-center gap-3">
                  {profile?.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt={member.name}
                      className="h-[52px] w-[52px] rounded-full object-cover"
                      style={{ objectPosition: profile.photoPosition ?? '50% 50%' }}
                    />
                  ) : (
                    <Avatar name={member.name} size={52} />
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{member.name}</p>
                    <p className="truncate text-sm font-medium text-primary">{member.role}</p>
                  </div>
                </div>

                {profile?.bio && (
                  <p className="mt-4 text-xs leading-relaxed text-ink/60">{profile.bio}</p>
                )}

                {hasContact && (
                  <div className="mt-4 space-y-1.5 border-t border-accent/20 pt-4 text-xs text-ink/60">
                    {profile.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone size={13} className="shrink-0 text-primary" />
                        {profile.phone}
                      </p>
                    )}
                    {profile.email && (
                      <p className="flex items-center gap-1.5">
                        <Mail size={13} className="shrink-0 text-primary" />
                        {profile.email}
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
