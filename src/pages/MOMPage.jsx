import { useEffect, useState } from 'react'
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
  Plus,
  Trash2,
} from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import CancelledMeetingNotice from '../components/CancelledMeetingNotice.jsx'
import { blankMOM } from '../data/mockMOM.js'
import { getSubmittedMOM, saveSubmittedMOM } from '../lib/mockMOMStore.js'
import { findNextActiveMeeting, getMeetings } from '../lib/mockRolesStore.js'

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

// A singular role's { name, comments } pair — SAA, PO, TMOD, GE, TTM,
// Timer, Ah-Counter, Grammarian, Listener all use this same shape.
function RoleFields({ label, value, disabled, onChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className={labelClass}>{label}</label>
        <input
          type="text"
          disabled={disabled}
          value={value.name}
          onChange={(e) => onChange('name', e.target.value)}
          className={`mt-1 ${inputClass}`}
        />
      </div>
      <div>
        <label className={labelClass}>Comments</label>
        <input
          type="text"
          disabled={disabled}
          value={value.comments}
          onChange={(e) => onChange('comments', e.target.value)}
          className={`mt-1 ${inputClass}`}
        />
      </div>
    </div>
  )
}

function emptySpeaker() {
  return { key: crypto.randomUUID(), name: '', project: '', comments: '' }
}
function emptyEvaluator() {
  return { key: crypto.randomUUID(), name: '', speakerEvaluated: '', comments: '' }
}
function emptyTtSpeaker() {
  return { key: crypto.randomUUID(), name: '', comments: '' }
}

export default function MOMPage() {
  const [meetings, setMeetings] = useState([])
  const [activeMeetingId, setActiveMeetingId] = useState(null)
  const [mom, setMom] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    getMeetings().then((fetched) => {
      setMeetings(fetched)
      const upcoming = findNextActiveMeeting(fetched)
      setActiveMeetingId((prev) => prev ?? upcoming?.id ?? fetched[fetched.length - 1]?.id ?? null)
    })
  }, [])

  useEffect(() => {
    if (!activeMeetingId) return
    const meeting = meetings.find((m) => m.id === activeMeetingId)
    getSubmittedMOM(activeMeetingId).then((existing) => {
      if (existing) {
        setMom(existing)
        setSubmitted(true)
        return
      }
      // Prefill singular-role names from the meeting's real assignments —
      // still fully editable either way.
      const blank = blankMOM()
      if (meeting) {
        for (const [key, roleId] of [
          ['saa', 'saa'],
          ['presidingOfficer', 'po'],
          ['tmod', 'tmod'],
          ['ge', 'ge'],
          ['ttMaster', 'ttm'],
          ['timer', 'timer'],
          ['ahCounter', 'ah-counter'],
          ['grammarian', 'grammarian'],
          ['listener', 'listener'],
        ]) {
          const takenBy = meeting.roles[roleId]?.takenBy
          if (takenBy) blank[key] = { ...blank[key], name: takenBy }
        }
      }
      setMom(blank)
      setSubmitted(false)
    })
  }, [activeMeetingId, meetings])

  const activeMeeting = meetings.find((m) => m.id === activeMeetingId)

  function setField(key, value) {
    setMom((prev) => ({ ...prev, [key]: value }))
  }

  function setRoleField(roleKey, field, value) {
    setMom((prev) => ({ ...prev, [roleKey]: { ...prev[roleKey], [field]: value } }))
  }

  function setArrayField(arrayKey, index, field, value) {
    setMom((prev) => ({
      ...prev,
      [arrayKey]: prev[arrayKey].map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }))
  }

  function addArrayItem(arrayKey, factory) {
    setMom((prev) => ({ ...prev, [arrayKey]: [...prev[arrayKey], factory()] }))
  }

  function removeArrayItem(arrayKey, index) {
    setMom((prev) => ({
      ...prev,
      [arrayKey]: prev[arrayKey].filter((_, i) => i !== index),
    }))
  }

  async function handleSubmit() {
    await saveSubmittedMOM(activeMeetingId, mom, {
      dateLabel: activeMeeting.dateLabel,
      theme: activeMeeting.theme ?? '',
    })
    setSubmitted(true)
  }

  if (!activeMeeting || !mom) {
    return (
      <MemberLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-ink/50">Loading meetings...</p>
        </div>
      </MemberLayout>
    )
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
              {activeMeeting.dateLabel}
            </h1>
          </div>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              submitted ? 'bg-primary/10 text-primary' : 'bg-accent/20 text-ink/60'
            }`}
          >
            {submitted ? 'Submitted' : 'Pending'}
          </span>
        </div>

        {/* Meeting tabs */}
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {meetings.map((m) => {
            const active = m.id === activeMeetingId
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveMeetingId(m.id)}
                className={`shrink-0 rounded-2xl border px-4 py-2.5 text-left transition ${
                  active
                    ? 'border-primary bg-primary text-cream'
                    : 'border-accent/30 bg-white text-ink hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-semibold">{m.label}</p>
                <p className={`text-xs ${active ? 'text-cream/80' : 'text-ink/50'}`}>
                  {m.dateLabel}
                  {m.cancelled ? ' · Cancelled' : ''}
                </p>
              </button>
            )
          })}
        </div>

        {activeMeeting.cancelled ? (
          <div className="mt-6">
            <CancelledMeetingNotice
              dateLabel={activeMeeting.dateLabel}
              reason={activeMeeting.cancelReason}
            />
          </div>
        ) : (
        <>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Meeting start time</label>
              <input
                type="text"
                disabled={submitted}
                value={mom.startTime}
                onChange={(e) => setField('startTime', e.target.value)}
                placeholder="e.g. 5:15 PM"
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
                placeholder="e.g. 6:50 PM"
                className={`mt-1 ${inputClass}`}
              />
            </div>
          </div>
        </Section>

        {/* Sergeant at Arms */}
        <Section icon={MessageSquare} title="Sergeant at Arms">
          <RoleFields
            label="Name"
            value={mom.saa}
            disabled={submitted}
            onChange={(field, value) => setRoleField('saa', field, value)}
          />
        </Section>

        {/* Presiding Officer */}
        <Section icon={MessageSquare} title="Presiding Officer">
          <RoleFields
            label="Name"
            value={mom.presidingOfficer}
            disabled={submitted}
            onChange={(field, value) => setRoleField('presidingOfficer', field, value)}
          />
        </Section>

        {/* TMOD */}
        <Section icon={MessageSquare} title="Toastmaster of the Day">
          <RoleFields
            label="Name"
            value={mom.tmod}
            disabled={submitted}
            onChange={(field, value) => setRoleField('tmod', field, value)}
          />
        </Section>

        {/* Speakers */}
        <Section icon={Mic} title="Speakers">
          {mom.speakers.map((speaker, i) => (
            <div key={speaker.key} className="rounded-2xl bg-cream/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <label className={labelClass}>Name</label>
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => removeArrayItem('speakers', i)}
                  aria-label="Remove speaker"
                  className="rounded-lg p-1 text-ink/40 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <input
                type="text"
                disabled={submitted}
                value={speaker.name}
                onChange={(e) => setArrayField('speakers', i, 'name', e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
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
          <button
            type="button"
            disabled={submitted}
            onClick={() => addArrayItem('speakers', emptySpeaker)}
            className="flex items-center gap-1.5 rounded-xl border border-dashed border-accent/50 px-4 py-2.5 text-sm font-semibold text-ink/60 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={15} />
            Add Speaker
          </button>
        </Section>

        {/* Evaluators */}
        <Section icon={MessageSquare} title="Evaluators">
          {mom.evaluators.map((evaluator, i) => (
            <div key={evaluator.key} className="rounded-2xl bg-cream/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <label className={labelClass}>Name</label>
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => removeArrayItem('evaluators', i)}
                  aria-label="Remove evaluator"
                  className="rounded-lg p-1 text-ink/40 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <input
                type="text"
                disabled={submitted}
                value={evaluator.name}
                onChange={(e) => setArrayField('evaluators', i, 'name', e.target.value)}
                className={`mt-1 ${inputClass}`}
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Speaker Evaluated</label>
                  <input
                    type="text"
                    disabled={submitted}
                    value={evaluator.speakerEvaluated}
                    onChange={(e) =>
                      setArrayField('evaluators', i, 'speakerEvaluated', e.target.value)
                    }
                    className={`mt-1 ${inputClass}`}
                  />
                </div>
                <div>
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
            </div>
          ))}
          <button
            type="button"
            disabled={submitted}
            onClick={() => addArrayItem('evaluators', emptyEvaluator)}
            className="flex items-center gap-1.5 rounded-xl border border-dashed border-accent/50 px-4 py-2.5 text-sm font-semibold text-ink/60 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={15} />
            Add Evaluator
          </button>
        </Section>

        {/* Table Topics */}
        <Section icon={MessageSquare} title="Table Topics">
          <RoleFields
            label="TT Master"
            value={mom.ttMaster}
            disabled={submitted}
            onChange={(field, value) => setRoleField('ttMaster', field, value)}
          />
          <div className="space-y-3">
            <label className={labelClass}>Table Topic Speakers</label>
            {mom.ttSpeakers.map((speaker, i) => (
              <div key={speaker.key} className="rounded-2xl bg-cream/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <label className={labelClass}>Name</label>
                  <button
                    type="button"
                    disabled={submitted}
                    onClick={() => removeArrayItem('ttSpeakers', i)}
                    aria-label="Remove table topic speaker"
                    className="rounded-lg p-1 text-ink/40 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  type="text"
                  disabled={submitted}
                  value={speaker.name}
                  onChange={(e) => setArrayField('ttSpeakers', i, 'name', e.target.value)}
                  className={`mt-1 ${inputClass}`}
                />
                <div className="mt-3">
                  <label className={labelClass}>Comments</label>
                  <input
                    type="text"
                    disabled={submitted}
                    value={speaker.comments}
                    onChange={(e) => setArrayField('ttSpeakers', i, 'comments', e.target.value)}
                    className={`mt-1 ${inputClass}`}
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              disabled={submitted}
              onClick={() => addArrayItem('ttSpeakers', emptyTtSpeaker)}
              className="flex items-center gap-1.5 rounded-xl border border-dashed border-accent/50 px-4 py-2.5 text-sm font-semibold text-ink/60 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={15} />
              Add Table Topic Speaker
            </button>
          </div>
        </Section>

        {/* TAGL */}
        <Section icon={ListChecks} title="Timer">
          <RoleFields
            label="Name"
            value={mom.timer}
            disabled={submitted}
            onChange={(field, value) => setRoleField('timer', field, value)}
          />
        </Section>
        <Section icon={ListChecks} title="Ah-Counter">
          <RoleFields
            label="Name"
            value={mom.ahCounter}
            disabled={submitted}
            onChange={(field, value) => setRoleField('ahCounter', field, value)}
          />
        </Section>
        <Section icon={ListChecks} title="Grammarian">
          <RoleFields
            label="Name"
            value={mom.grammarian}
            disabled={submitted}
            onChange={(field, value) => setRoleField('grammarian', field, value)}
          />
        </Section>
        <Section icon={ListChecks} title="Listener">
          <RoleFields
            label="Name"
            value={mom.listener}
            disabled={submitted}
            onChange={(field, value) => setRoleField('listener', field, value)}
          />
        </Section>

        {/* General Evaluator */}
        <Section icon={MessageSquare} title="General Evaluator">
          <RoleFields
            label="Name"
            value={mom.ge}
            disabled={submitted}
            onChange={(field, value) => setRoleField('ge', field, value)}
          />
          <div>
            <label className={labelClass}>Overall Meeting Evaluation</label>
            <textarea
              rows={3}
              disabled={submitted}
              value={mom.geOverallComments}
              onChange={(e) => setField('geOverallComments', e.target.value)}
              placeholder="The GE's own assessment of the meeting..."
              className={`mt-1 ${textareaClass}`}
            />
          </div>
        </Section>

        {/* Awards */}
        <Section icon={Award} title="Awards Given">
          <textarea
            rows={2}
            disabled={submitted}
            value={mom.awardsGiven}
            onChange={(e) => setField('awardsGiven', e.target.value)}
            placeholder="e.g. Best Speaker: ..."
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
            MOM submitted for {activeMeeting.dateLabel}.
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
        </>
        )}
      </div>
    </MemberLayout>
  )
}
