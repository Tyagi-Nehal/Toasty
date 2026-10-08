import { useEffect, useRef, useState } from 'react'
import { BookOpen, Pencil, Plus } from 'lucide-react'
import MemberLayout from '../components/MemberLayout.jsx'
import { getAccount, hasExcomRole } from '../lib/mockAuth.js'
import { ENTRY_KINDS, PATH_GROUPS, STATUS_LABELS, getPathwayMembers, getPathways, getPathwayDetails, getPathwayMeetings, savePathway, savePathwayEntry } from '../lib/pathwaysStore.js'

const inputClass = 'mt-1 block w-full rounded-xl border border-accent/40 bg-cream px-3 py-2.5 text-sm text-ink'
const buttonClass = 'inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40'
const levels = [1, 2, 3, 4, 5]
const dateLabel = (date) => date ? new Date(`${date}T12:00:00`).toLocaleDateString('en-IN') : '—'
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())

function Editor({ kind, record, path, clubId, memberId, meetings, onSaved, onCancel }) {
  const isPath = kind === 'path'
  const [form, setForm] = useState(() => record ? { ...record } : isPath
    ? { path_name: '', current_level: 1, status: 'in_progress', started_on: '', completed_on: '', notes: '' }
    : { title: '', project_name: '', level: path.current_level, kind: 'speech', status: 'planned', completed_on: '', meeting_id: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  // Reuse the same UUID after an uncertain response instead of creating duplicate records.
  const newId = useRef(crypto.randomUUID())
  const patch = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  async function submit(event) {
    event.preventDefault()
    if (pending.current) return
    pending.current = true; setSaving(true); setError('')
    const shared = { status: form.status, completed_on: form.status === 'completed' ? form.completed_on : null, notes: form.notes.trim() }
    const values = isPath ? {
      ...shared, path_name: form.path_name.trim(), current_level: Number(form.current_level), started_on: form.started_on || null,
    } : {
      ...shared, title: form.title.trim(), project_name: form.project_name.trim(), kind: form.kind, level: Number(form.level), meeting_id: form.meeting_id ? Number(form.meeting_id) : null,
    }
    if (!record) Object.assign(values, { id: newId.current, club_id: clubId, member_id: Number(memberId), ...(!isPath ? { enrollment_id: path.id } : {}) })
    try {
      const saved = await (isPath ? savePathway : savePathwayEntry)(values, record)
      onSaved(saved, isPath)
    } catch (failure) {
      setError(failure.code === '23505' ? 'This record may already have been saved. Cancel and reload to check it.' : failure.message || 'Could not save. Please try again.')
    } finally { pending.current = false; setSaving(false) }
  }
  return <form onSubmit={submit} className="mt-5 rounded-2xl border border-primary/30 bg-white p-5">
    <h2 className="font-bold">{record ? 'Edit' : 'Add'} {isPath ? 'path' : 'progress record'}</h2>
    <fieldset disabled={saving} className="mt-4 space-y-4">
      {isPath ? <>
        <label className="block text-sm font-semibold">Path name
          <input required maxLength={160} list="pathway-options" value={form.path_name} onChange={(e) => patch('path_name', e.target.value)} className={inputClass} placeholder="Choose or type a path" />
          <datalist id="pathway-options">{Object.entries(PATH_GROUPS).flatMap(([group, paths]) => paths.map((name) => <option key={name} value={name}>{group}</option>))}</datalist>
        </label>
        <label className="block text-sm font-semibold">Started on (optional)<input type="date" value={form.started_on ?? ''} onChange={(e) => patch('started_on', e.target.value)} className={inputClass} /></label>
      </> : <>
        <label className="block text-sm font-semibold">Record type<select value={form.kind} onChange={(e) => patch('kind', e.target.value)} className={inputClass}>{Object.entries(ENTRY_KINDS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="block text-sm font-semibold">{form.kind === 'speech' ? 'Speech title' : 'Title'}<input required maxLength={200} value={form.title} onChange={(e) => patch('title', e.target.value)} className={inputClass} /></label>
        <label className="block text-sm font-semibold">Project name (optional)<input maxLength={200} value={form.project_name} onChange={(e) => patch('project_name', e.target.value)} placeholder="e.g. Evaluation and Feedback" className={inputClass} /></label>
        <label className="block text-sm font-semibold">Meeting (optional)<select value={form.meeting_id ?? ''} onChange={(e) => patch('meeting_id', e.target.value)} className={inputClass}>
          <option value="">No meeting / completed elsewhere</option>{meetings.map((meeting) => <option key={meeting.id} value={meeting.id}>{meeting.label} · {dateLabel(meeting.meeting_date)}{meeting.cancelled ? ' (cancelled)' : ''}</option>)}
        </select></label>
      </>}
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-semibold">{isPath ? 'Current level' : 'Level'}<select value={isPath ? form.current_level : form.level} onChange={(e) => patch(isPath ? 'current_level' : 'level', e.target.value)} className={inputClass}>{levels.map((level) => <option key={level} value={level}>Level {level}</option>)}</select></label>
        <label className="block text-sm font-semibold">Status<select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value, ...(isPath && e.target.value === 'completed' ? { current_level: 5 } : {}) }))} className={inputClass}>{(isPath ? ['in_progress','on_hold','completed'] : ['planned','in_progress','completed']).map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}</select></label>
      </div>
      {form.status === 'completed' && <label className="block text-sm font-semibold">Completion date<input required type="date" max={today()} value={form.completed_on ?? ''} onChange={(e) => patch('completed_on', e.target.value)} className={inputClass} /></label>}
      <label className="block text-sm font-semibold">Notes (visible to the member)<textarea maxLength={2000} rows={3} value={form.notes} onChange={(e) => patch('notes', e.target.value)} className={inputClass} /></label>
      <div className="flex gap-3"><button className={buttonClass}>{saving ? 'Saving…' : 'Save'}</button><button type="button" onClick={onCancel} className="px-4 text-sm font-semibold">Cancel</button></div>
    </fieldset>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </form>
}

export default function PathwaysPage({ manage = false }) {
  const account = getAccount()
  const clubId = account?.clubId
  const memberEmail = account?.email
  const canEdit = manage && hasExcomRole('VPE')
  const [members, setMembers] = useState([])
  const [memberId, setMemberId] = useState('')
  const [paths, setPaths] = useState([])
  const [pathId, setPathId] = useState('')
  const [meetings, setMeetings] = useState([])
  const [details, setDetails] = useState({ entries: [], history: [] })
  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState(null)
  const [revision, setRevision] = useState(0)
  const path = paths.find((item) => item.id === pathId)
  useEffect(() => {
    let stopped = false
    if (!canEdit) {
      getPathwayMeetings(clubId).then((schedule) => { if (!stopped) setMeetings(schedule) })
        .catch(() => { /* Progress remains readable when meeting labels are unavailable. */ })
      return () => { stopped = true }
    }
    Promise.all([getPathwayMembers(clubId), getPathwayMeetings(clubId)])
      .then(([roster, schedule]) => { if (!stopped) { setMembers(roster); setMeetings(schedule); setMemberId((id) => id || String(roster[0]?.id ?? '')) } })
      .catch((failure) => { if (!stopped) { setError(failure.message); setLoading(false) } })
    return () => { stopped = true }
  }, [clubId, canEdit, revision])
  useEffect(() => {
    let stopped = false
    if (canEdit && !memberId) { setPaths([]); setLoading(false); return }
    setLoading(true); setError(''); setDetails({ entries: [], history: [] })
    getPathways(clubId, canEdit ? memberId : null, canEdit ? null : memberEmail)
      .then((rows) => { if (!stopped) { setPaths(rows); setPathId((id) => rows.some((p) => p.id === id) ? id : rows[0]?.id ?? '') } })
      .catch((failure) => { if (!stopped) { setPaths([]); setError(failure.message) } })
      .finally(() => { if (!stopped) setLoading(false) })
    return () => { stopped = true }
  }, [clubId, memberId, memberEmail, canEdit, revision])
  useEffect(() => {
    let stopped = false
    setDetails({ entries: [], history: [] })
    if (!pathId) return
    setDetailsLoading(true)
    getPathwayDetails(pathId).then((result) => { if (!stopped) setDetails(result) })
      .catch((failure) => { if (!stopped) setError(failure.message) })
      .finally(() => { if (!stopped) setDetailsLoading(false) })
    return () => { stopped = true }
  }, [pathId, revision])
  function saved(row, isPath) {
    setEditor(null)
    if (isPath) setPathId(row.id)
    setRevision((value) => value + 1)
  }
  return <MemberLayout><div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <h1 className="flex items-center gap-2 text-2xl font-extrabold text-ink"><BookOpen className="text-primary" />{canEdit ? 'Manage Pathways' : 'My Pathways'}</h1>
    <p className="mt-2 text-sm text-ink/60">Your club’s progress record. Official level approvals and awards are managed separately in Toastmasters Base Camp.</p>
    {canEdit && <label className="mt-5 block text-sm font-semibold">Member<select value={memberId} disabled={!!editor} onChange={(e) => { setMemberId(e.target.value); setPathId(''); setPaths([]) }} className={inputClass}><option value="">Choose a member</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name} ({member.email})</option>)}</select></label>}
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error} <button onClick={() => setRevision((value) => value + 1)} className="underline">Reload records</button></p>}
    {loading ? <p className="mt-6">Loading Pathways…</p> : <>
      <div className="mt-5 flex flex-wrap gap-2">{paths.map((item) => <button key={item.id} disabled={!!editor} onClick={() => setPathId(item.id)} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${item.id === pathId ? 'border-primary bg-primary/10 text-primary' : 'border-accent/30 bg-white'}`}>{item.path_name}</button>)}
        {canEdit && memberId && <button disabled={!!editor} onClick={() => setEditor({ kind: 'path' })} className={buttonClass}><Plus size={16} />Add path</button>}
      </div>
      {!paths.length && !error && <p className="mt-6 text-ink/60">{canEdit ? 'No paths recorded for this member yet.' : 'Your VPE has not recorded a path for you yet.'}</p>}
      {editor && <Editor key={editor.record?.id ?? editor.kind} {...editor} path={path} clubId={clubId} memberId={memberId} meetings={meetings} onSaved={saved} onCancel={() => setEditor(null)} />}
      {path && <>
        <section className="mt-6 rounded-3xl border border-accent/30 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-bold">{path.path_name}</h2>{canEdit && <button disabled={!!editor} onClick={() => setEditor({ kind: 'path', record: path })} className="flex items-center gap-2 text-sm font-semibold text-primary"><Pencil size={15} />Edit path</button>}</div>
          <p className="mt-2 font-semibold text-primary">Level {path.current_level} of 5 · {STATUS_LABELS[path.status]}</p>
          <p className="mt-2 text-sm text-ink/60">Started: {dateLabel(path.started_on)}{path.completed_on ? ` · Completed: ${dateLabel(path.completed_on)}` : ''}</p>
          {path.notes && <p className="mt-3 whitespace-pre-wrap text-sm">{path.notes}</p>}
          <p className="mt-3 text-xs text-ink/50">Last updated by {path.updated_by} · {new Date(path.updated_at).toLocaleDateString()}</p>
        </section>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">Projects and speeches</h2>{canEdit && <button disabled={!!editor || detailsLoading} onClick={() => setEditor({ kind: 'entry' })} className={buttonClass}><Plus size={16} />Add progress</button>}</div>
        {detailsLoading ? <p className="mt-4">Loading progress…</p> : levels.map((level) => <section key={level} className="mt-4 rounded-2xl border border-accent/30 bg-white p-5">
          <h3 className="font-bold">Level {level}</h3>
          {!details.entries.some((entry) => entry.level === level) && <p className="mt-2 text-sm text-ink/50">No records yet.</p>}
          {details.entries.filter((entry) => entry.level === level).map((entry) => <article key={entry.id} className="mt-3 border-t border-accent/20 pt-3">
            <div className="flex justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-primary">{ENTRY_KINDS[entry.kind]} · {STATUS_LABELS[entry.status]}</p><h4 className="font-semibold">{entry.title}</h4></div>{canEdit && <button disabled={!!editor} onClick={() => setEditor({ kind: 'entry', record: entry })} className="text-sm font-semibold text-primary">Edit</button>}</div>
            {entry.project_name && <p className="mt-1 text-sm">Project: {entry.project_name}</p>}
            {entry.completed_on && <p className="mt-1 text-sm text-ink/60">Completed {dateLabel(entry.completed_on)}</p>}
            {entry.meeting_id && <p className="mt-1 text-sm text-ink/60">{meetings.find((meeting) => meeting.id === entry.meeting_id)?.label ?? `Meeting #${entry.meeting_id}`}</p>}
            {entry.notes && <p className="mt-2 whitespace-pre-wrap text-sm">{entry.notes}</p>}
          </article>)}
        </section>)}
        <details className="mt-6 rounded-2xl border border-accent/30 bg-white p-5"><summary className="cursor-pointer font-semibold">Recent changes</summary><ul className="mt-3 space-y-3">{details.history.map((event) => <li key={event.id} className="text-sm"><p>{event.before_record ? 'Updated' : 'Added'} {event.after_record.title ?? event.after_record.path_name} · {STATUS_LABELS[event.after_record.status]}</p><p className="text-xs text-ink/50">{event.changed_by} · {new Date(event.changed_at).toLocaleString()}</p></li>)}</ul></details>
      </>}
    </>}
  </div></MemberLayout>
}
