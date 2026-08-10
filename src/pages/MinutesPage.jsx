import { useEffect, useState } from 'react'
import {
  FileText,
  MapPin,
  Mic,
  MessageSquare,
  ListChecks,
  Award,
  Clock,
  Hourglass,
} from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import { getAllSubmittedMOMs } from '../lib/mockMOMStore.js'
import { getMeetings } from '../lib/mockRolesStore.js'

function Section({ icon: Icon, title, children }) {
  return (
    <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2 font-semibold text-ink">
        <Icon size={17} className="text-primary" />
        {title}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink/50">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value || '—'}</p>
    </div>
  )
}

// Singular roles are now { name, comments } pairs — small shared renderer
// so we don't repeat the same two-Field block nine times.
function RoleField({ label, value }) {
  return (
    <>
      <Field label={label} value={value?.name} />
      <Field label={`${label} — Comments`} value={value?.comments} />
    </>
  )
}

export default function MinutesPage() {
  const [published, setPublished] = useState([])
  const [activeMeetingId, setActiveMeetingId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMeetings().then((meetings) => {
      const submittedByMeetingId = getAllSubmittedMOMs()
      const withMom = meetings
        .filter((m) => submittedByMeetingId[m.id])
        .map((m) => ({ meeting: m, mom: submittedByMeetingId[m.id] }))
        .sort((a, b) => (a.meeting.dateLabel < b.meeting.dateLabel ? 1 : -1))
      setPublished(withMom)
      setActiveMeetingId((prev) => prev ?? withMom[0]?.meeting.id ?? null)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <MemberLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-ink/50">Loading...</p>
        </div>
      </MemberLayout>
    )
  }

  const active = published.find((p) => p.meeting.id === activeMeetingId)

  if (!active) {
    return (
      <MemberLayout>
        <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-20 text-center sm:px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20 text-primary">
            <Hourglass size={26} />
          </div>
          <h1 className="text-xl font-bold text-ink">Minutes not published yet</h1>
          <p className="text-sm text-ink/60">
            The Secretary hasn't submitted the minutes for this meeting yet.
            Check back after the meeting.
          </p>
        </div>
      </MemberLayout>
    )
  }

  const { meeting, mom } = active
  const submittedLabel = new Date(mom.submittedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <MemberLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          <FileText size={16} />
          Minutes of Meeting
        </div>
        <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">{meeting.dateLabel}</h1>
        {mom.theme && <p className="text-sm text-ink/60">Theme: {mom.theme}</p>}
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink/50">
          <Clock size={13} />
          Published {submittedLabel}
        </p>

        {published.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {published.map(({ meeting: m }) => {
              const isActive = m.id === activeMeetingId
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMeetingId(m.id)}
                  className={`shrink-0 rounded-2xl border px-4 py-2 text-left text-sm font-semibold transition ${
                    isActive
                      ? 'border-primary bg-primary text-cream'
                      : 'border-accent/30 bg-white text-ink hover:border-primary/50'
                  }`}
                >
                  {m.dateLabel}
                </button>
              )
            })}
          </div>
        )}

        <Section icon={MapPin} title="Meeting Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location" value={mom.location} />
            <Field label="Meeting time" value={`${mom.startTime} – ${mom.endTime}`} />
          </div>
        </Section>

        <Section icon={MessageSquare} title="Sergeant at Arms">
          <div className="grid gap-4 sm:grid-cols-2">
            <RoleField label="Sergeant at Arms" value={mom.saa} />
          </div>
        </Section>

        <Section icon={MessageSquare} title="Presiding Officer">
          <div className="grid gap-4 sm:grid-cols-2">
            <RoleField label="Presiding Officer" value={mom.presidingOfficer} />
          </div>
        </Section>

        <Section icon={MessageSquare} title="Toastmaster of the Day">
          <div className="grid gap-4 sm:grid-cols-2">
            <RoleField label="Toastmaster of the Day" value={mom.tmod} />
          </div>
        </Section>

        <Section icon={Mic} title="Speakers">
          {mom.speakers.length === 0 && <p className="text-sm text-ink/50">No speakers recorded.</p>}
          {mom.speakers.map((speaker, i) => (
            <div key={speaker.key ?? i} className="rounded-2xl bg-cream/60 p-4">
              <p className="text-sm font-semibold text-ink">{speaker.name || '—'}</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <Field label="Project" value={speaker.project} />
                <Field label="Comments" value={speaker.comments} />
              </div>
            </div>
          ))}
        </Section>

        <Section icon={MessageSquare} title="Evaluators">
          {mom.evaluators.length === 0 && (
            <p className="text-sm text-ink/50">No evaluators recorded.</p>
          )}
          {mom.evaluators.map((evaluator, i) => (
            <div key={evaluator.key ?? i} className="rounded-2xl bg-cream/60 p-4">
              <p className="text-sm font-semibold text-ink">
                {evaluator.name || '—'}{' '}
                {evaluator.speakerEvaluated && (
                  <span className="font-normal text-ink/50">
                    evaluated {evaluator.speakerEvaluated}
                  </span>
                )}
              </p>
              <div className="mt-2">
                <Field label="Comments" value={evaluator.comments} />
              </div>
            </div>
          ))}
        </Section>

        <Section icon={MessageSquare} title="Table Topics">
          <div className="grid gap-4 sm:grid-cols-2">
            <RoleField label="TT Master" value={mom.ttMaster} />
          </div>
          {mom.ttSpeakers.length === 0 ? (
            <p className="text-sm text-ink/50">No table topic speakers recorded.</p>
          ) : (
            mom.ttSpeakers.map((speaker, i) => (
              <div key={speaker.key ?? i} className="rounded-2xl bg-cream/60 p-4">
                <p className="text-sm font-semibold text-ink">{speaker.name || '—'}</p>
                <div className="mt-2">
                  <Field label="Comments" value={speaker.comments} />
                </div>
              </div>
            ))
          )}
        </Section>

        <Section icon={ListChecks} title="Timer">
          <div className="grid gap-4 sm:grid-cols-2">
            <RoleField label="Timer" value={mom.timer} />
          </div>
        </Section>

        <Section icon={ListChecks} title="Ah-Counter">
          <div className="grid gap-4 sm:grid-cols-2">
            <RoleField label="Ah-Counter" value={mom.ahCounter} />
          </div>
        </Section>

        <Section icon={ListChecks} title="Grammarian">
          <div className="grid gap-4 sm:grid-cols-2">
            <RoleField label="Grammarian" value={mom.grammarian} />
          </div>
        </Section>

        <Section icon={ListChecks} title="Listener">
          <div className="grid gap-4 sm:grid-cols-2">
            <RoleField label="Listener" value={mom.listener} />
          </div>
        </Section>

        <Section icon={MessageSquare} title="General Evaluator">
          <div className="grid gap-4 sm:grid-cols-2">
            <RoleField label="General Evaluator" value={mom.ge} />
          </div>
          <Field label="Overall Meeting Evaluation" value={mom.geOverallComments} />
        </Section>

        <Section icon={Award} title="Awards Given">
          <p className="text-sm text-ink/80">{mom.awardsGiven || '—'}</p>
        </Section>

        <Section icon={ListChecks} title="Action Items">
          <p className="text-sm text-ink/80">{mom.actionItems || '—'}</p>
        </Section>
      </div>
    </MemberLayout>
  )
}
