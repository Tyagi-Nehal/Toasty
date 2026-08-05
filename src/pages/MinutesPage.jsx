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
import { getSubmittedMOM } from '../lib/mockMOMStore.js'

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

export default function MinutesPage() {
  const mom = getSubmittedMOM()

  if (!mom) {
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
        <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">
          {mom.dateLabel}
        </h1>
        <p className="text-sm text-ink/60">Theme: {mom.theme}</p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink/50">
          <Clock size={13} />
          Published {submittedLabel}
        </p>

        <Section icon={MapPin} title="Meeting Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location" value={mom.location} />
            <Field label="Meeting time" value={`${mom.startTime} – ${mom.endTime}`} />
            <Field label="Presiding Officer" value={mom.presidingOfficer} />
            <Field label="Toastmaster of the Day" value={mom.tmod} />
            <Field label="General Evaluator" value={mom.ge} />
          </div>
        </Section>

        <Section icon={Mic} title="Speakers">
          {mom.speakers.map((speaker) => (
            <div key={speaker.name} className="rounded-2xl bg-cream/60 p-4">
              <p className="text-sm font-semibold text-ink">{speaker.name}</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <Field label="Project" value={speaker.project} />
                <Field label="Comments" value={speaker.comments} />
              </div>
            </div>
          ))}
        </Section>

        <Section icon={MessageSquare} title="Evaluators">
          {mom.evaluators.map((evaluator) => (
            <div key={evaluator.name} className="rounded-2xl bg-cream/60 p-4">
              <p className="text-sm font-semibold text-ink">
                {evaluator.name}{' '}
                <span className="font-normal text-ink/50">
                  evaluated {evaluator.speakerEvaluated}
                </span>
              </p>
              <div className="mt-2">
                <Field label="Comments" value={evaluator.comments} />
              </div>
            </div>
          ))}
        </Section>

        <Section icon={MessageSquare} title="Table Topics">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="TT Master" value={mom.ttMaster} />
            <Field label="TT Speakers" value={mom.ttSpeakers} />
          </div>
          <Field label="Comments" value={mom.ttComments} />
        </Section>

        <Section icon={ListChecks} title="TAGL">
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Timer" value={mom.timer} />
            <Field label="Ah-Counter" value={mom.ahCounter} />
            <Field label="Grammarian" value={mom.grammarian} />
            <Field label="Listener" value={mom.listener} />
          </div>
          <Field label="Comments" value={mom.taglComments} />
        </Section>

        <Section icon={MessageSquare} title="General Evaluator Comments">
          <p className="text-sm text-ink/80">{mom.geComments || '—'}</p>
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
