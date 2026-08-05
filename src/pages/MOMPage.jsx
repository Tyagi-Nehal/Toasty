import { useState } from 'react'
import {
  FileText,
  Clock,
  MapPin,
  Mic,
  MessageSquare,
  ListChecks,
  Award,
  Send,
  CheckCircle2,
} from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import { momMeta, initialMOM } from '../data/mockMOM.js'
import { getSubmittedMOM, saveSubmittedMOM } from '../lib/mockMOMStore.js'

const inputClass =
  'w-full rounded-xl border border-accent/40 bg-cream px-3.5 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'
const textareaClass = `${inputClass} resize-none`
const labelClass = 'text-xs font-medium text-ink/60'

function Section({ icon: Icon, title, children }) {
  return (
    <div className="mt-6 rounded-3xl border border-accent/30 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2 font-semibold text-ink">
        <Icon size={17} className="text-primary" />
        {title}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  )
}

export default function MOMPage() {
  const existing = getSubmittedMOM()
  const [mom, setMom] = useState(existing ?? initialMOM)
  const [submitted, setSubmitted] = useState(Boolean(existing))

  function setField(key, value) {
    setMom((prev) => ({ ...prev, [key]: value }))
  }

  function setArrayField(arrayKey, index, field, value) {
    setMom((prev) => ({
      ...prev,
      [arrayKey]: prev[arrayKey].map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }))
  }

  function handleSubmit() {
    saveSubmittedMOM(mom, { dateLabel: momMeta.dateLabel, theme: momMeta.theme, startTime: momMeta.startTime })
    setSubmitted(true)
  }

  return (
    <MemberLayout>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <FileText size={16} />
              Minutes of Meeting
            </div>
            <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">
              {momMeta.dateLabel}
            </h1>
            <p className="text-sm text-ink/60">Theme: {momMeta.theme}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              submitted ? 'bg-primary/10 text-primary' : 'bg-accent/20 text-ink/60'
            }`}
          >
            {submitted ? 'Submitted' : 'Pending'}
          </span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink/50">
          <Clock size={13} />
          Due by {momMeta.deadlineLabel}
        </p>

        {/* Meeting details */}
        <Section icon={MapPin} title="Meeting Details">
          <div>
            <label className={labelClass}>Location</label>
            <input
              type="text"
              disabled={submitted}
              value={mom.location}
              onChange={(e) => setField('location', e.target.value)}
              placeholder="e.g. Innovation Centre, MAHE Bengaluru Campus"
              className={`mt-1 ${inputClass}`}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Presiding Officer</label>
              <input
                type="text"
                disabled={submitted}
                value={mom.presidingOfficer}
                onChange={(e) => setField('presidingOfficer', e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>Toastmaster of the Day</label>
              <input
                type="text"
                disabled={submitted}
                value={mom.tmod}
                onChange={(e) => setField('tmod', e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>General Evaluator</label>
              <input
                type="text"
                disabled={submitted}
                value={mom.ge}
                onChange={(e) => setField('ge', e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Meeting start time (auto-filled)</label>
              <input
                type="text"
                disabled
                value={momMeta.startTime}
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>Meeting end time</label>
              <input
                type="text"
                disabled={submitted}
                value={mom.endTime}
                onChange={(e) => setField('endTime', e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </div>
          </div>
        </Section>

        {/* Speakers */}
        <Section icon={Mic} title="Speakers">
          {mom.speakers.map((speaker, i) => (
            <div key={speaker.name} className="rounded-2xl bg-cream/60 p-4">
              <p className="text-sm font-semibold text-ink">{speaker.name}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Project</label>
                  <input
                    type="text"
                    disabled={submitted}
                    value={speaker.project}
                    onChange={(e) => setArrayField('speakers', i, 'project', e.target.value)}
                    placeholder="e.g. Pathways: Effective Body Language"
                    className={`mt-1 ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Comments</label>
                  <input
                    type="text"
                    disabled={submitted}
                    value={speaker.comments}
                    onChange={(e) => setArrayField('speakers', i, 'comments', e.target.value)}
                    className={`mt-1 ${inputClass}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </Section>

        {/* Evaluators */}
        <Section icon={MessageSquare} title="Evaluators">
          {mom.evaluators.map((evaluator, i) => (
            <div key={evaluator.name} className="rounded-2xl bg-cream/60 p-4">
              <p className="text-sm font-semibold text-ink">
                {evaluator.name}{' '}
                <span className="font-normal text-ink/50">
                  evaluated {evaluator.speakerEvaluated}
                </span>
              </p>
              <div className="mt-3">
                <label className={labelClass}>Comments</label>
                <input
                  type="text"
                  disabled={submitted}
                  value={evaluator.comments}
                  onChange={(e) => setArrayField('evaluators', i, 'comments', e.target.value)}
                  className={`mt-1 ${inputClass}`}
                />
              </div>
            </div>
          ))}
        </Section>

        {/* Table Topics */}
        <Section icon={MessageSquare} title="Table Topics">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>TT Master</label>
              <input
                type="text"
                disabled={submitted}
                value={mom.ttMaster}
                onChange={(e) => setField('ttMaster', e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>TT Speakers</label>
              <input
                type="text"
                disabled={submitted}
                value={mom.ttSpeakers}
                onChange={(e) => setField('ttSpeakers', e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Comments</label>
            <textarea
              rows={2}
              disabled={submitted}
              value={mom.ttComments}
              onChange={(e) => setField('ttComments', e.target.value)}
              className={`mt-1 ${textareaClass}`}
            />
          </div>
        </Section>

        {/* TAGL */}
        <Section icon={ListChecks} title="TAGL">
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className={labelClass}>Timer</label>
              <input
                type="text"
                disabled={submitted}
                value={mom.timer}
                onChange={(e) => setField('timer', e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>Ah-Counter</label>
              <input
                type="text"
                disabled={submitted}
                value={mom.ahCounter}
                onChange={(e) => setField('ahCounter', e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>Grammarian</label>
              <input
                type="text"
                disabled={submitted}
                value={mom.grammarian}
                onChange={(e) => setField('grammarian', e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </div>
            <div>
              <label className={labelClass}>Listener</label>
              <input
                type="text"
                disabled={submitted}
                value={mom.listener}
                onChange={(e) => setField('listener', e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Comments</label>
            <textarea
              rows={2}
              disabled={submitted}
              value={mom.taglComments}
              onChange={(e) => setField('taglComments', e.target.value)}
              className={`mt-1 ${textareaClass}`}
            />
          </div>
        </Section>

        {/* GE comments */}
        <Section icon={MessageSquare} title="General Evaluator Comments">
          <textarea
            rows={3}
            disabled={submitted}
            value={mom.geComments}
            onChange={(e) => setField('geComments', e.target.value)}
            placeholder="Overall meeting evaluation..."
            className={textareaClass}
          />
        </Section>

        {/* Awards */}
        <Section icon={Award} title="Awards Given">
          <textarea
            rows={2}
            disabled={submitted}
            value={mom.awardsGiven}
            onChange={(e) => setField('awardsGiven', e.target.value)}
            placeholder="e.g. Best Speaker: Vikram"
            className={textareaClass}
          />
        </Section>

        {/* Action items */}
        <Section icon={ListChecks} title="Action Items">
          <textarea
            rows={3}
            disabled={submitted}
            value={mom.actionItems}
            onChange={(e) => setField('actionItems', e.target.value)}
            placeholder="Follow-ups for next meeting..."
            className={textareaClass}
          />
        </Section>

        {submitted ? (
          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-primary/10 p-4 text-sm font-medium text-primary">
            <CheckCircle2 size={18} />
            MOM submitted for {momMeta.dateLabel}.
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-cream shadow-md shadow-primary/20 transition hover:bg-primary-dark"
          >
            <Send size={16} />
            Submit MOM
          </button>
        )}
      </div>
    </MemberLayout>
  )
}
