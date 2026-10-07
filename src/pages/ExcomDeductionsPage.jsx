import { useEffect, useRef, useState } from 'react'
import MemberLayout from '../components/MemberLayout.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { getAccount } from '../lib/mockAuth.js'

const inputClass = 'mt-1 w-full rounded-xl border border-accent/40 bg-cream px-4 py-2.5 text-sm'

export default function ExcomDeductionsPage() {
  const clubId = getAccount()?.clubId
  const [members, setMembers] = useState([])
  const [history, setHistory] = useState([])
  const [memberId, setMemberId] = useState('')
  const [points, setPoints] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const request = useRef(null)
  const busy = useRef(false)

  async function refreshHistory() {
    const { data, error } = await supabase.from('excom_points')
      .select('id,email,role,points,note,awarded_at').eq('club_id', clubId)
      .eq('category', 'president_deduction').order('awarded_at', { ascending: false }).limit(100)
    if (error) throw error
    setHistory(data ?? [])
  }

  useEffect(() => {
    let stopped = false
    async function load() {
      try {
        const [appointments, deductions] = await Promise.all([
          supabase.from('excom_appointments').select('id,name,email,role').eq('club_id', clubId).order('name'),
          supabase.from('excom_points').select('id,email,role,points,note,awarded_at')
            .eq('club_id', clubId).eq('category', 'president_deduction')
            .order('awarded_at', { ascending: false }).limit(100),
        ])
        if (appointments.error || deductions.error) throw appointments.error || deductions.error
        if (!stopped) { setMembers(appointments.data ?? []); setHistory(deductions.data ?? []) }
      } catch {
        if (!stopped) setMessage('Could not load ExCom members and deduction history. Please reload.')
      } finally {
        if (!stopped) setLoading(false)
      }
    }
    load()
    return () => { stopped = true }
  }, [clubId])

  async function submit(event) {
    event.preventDefault()
    const amount = Number(points)
    if (busy.current || !memberId || !Number.isInteger(amount) || amount < 1 || amount > 2147483647 || reason.trim().length < 3) return
    busy.current = true
    setSaving(true)
    setMessage('')
    const payload = { p_appointment_id: Number(memberId), p_points: amount, p_reason: reason.trim() }
    const signature = JSON.stringify(payload)
    if (request.current?.signature !== signature) request.current = { signature, id: crypto.randomUUID() }
    try {
      const { error } = await supabase.rpc('deduct_excom_points', { ...payload, p_request_id: request.current.id })
      if (error) throw error
      request.current = null
      setPoints(''); setReason('')
      setMessage('Points deducted and recorded in this month’s history.')
      try { await refreshHistory() } catch { setMessage('Deduction saved. Reload to view updated history.') }
    } catch (error) {
      setMessage(error.message || 'Could not save the deduction. Try again.')
    } finally {
      busy.current = false
      setSaving(false)
    }
  }

  return <MemberLayout><div className="mx-auto max-w-3xl px-4 py-8">
    <h1 className="text-2xl font-extrabold text-ink">Deduct ExCom points</h1>
    <p className="mt-2 text-sm text-ink/60">Deductions apply to the current month. The member can see the reason in their points history.</p>
    <form onSubmit={submit} className="mt-6 space-y-4 rounded-3xl border border-accent/30 bg-white p-6">
      <label className="block text-sm font-semibold">ExCom member
        <select required value={memberId} onChange={(e) => setMemberId(e.target.value)} disabled={saving || loading} className={inputClass}>
          <option value="">{loading ? 'Loading…' : 'Choose a member'}</option>
          {members.map((member) => <option key={member.id} value={member.id}>{member.name} — {member.role} ({member.email})</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold">Points to deduct
        <input required type="number" min="1" max="2147483647" step="1" value={points} disabled={saving} onChange={(e) => setPoints(e.target.value)} className={inputClass} />
      </label>
      <label className="block text-sm font-semibold">Reason
        <textarea required minLength={3} maxLength={1000} value={reason} disabled={saving} onChange={(e) => setReason(e.target.value)} className={inputClass} />
      </label>
      <button disabled={saving || loading || !memberId} className="rounded-xl bg-primary px-5 py-3 font-semibold text-white disabled:opacity-40">{saving ? 'Saving…' : 'Deduct points'}</button>
      {message && <p role="status" className="text-sm">{message}</p>}
    </form>
    <h2 className="mt-8 font-bold">Recent deductions</h2>
    <ul className="mt-3 space-y-3">{history.map((entry) => <li key={entry.id} className="rounded-xl bg-white p-4">
      <p className="font-semibold">{members.find((m) => m.email.toLowerCase() === entry.email.toLowerCase())?.name ?? entry.email} · {entry.role} · {entry.points} pts</p>
      <p className="text-sm">{entry.note}</p>
      <p className="mt-1 text-xs text-ink/60">{new Date(entry.awarded_at).toLocaleString()}</p>
    </li>)}</ul>
    {!loading && !history.length && <p className="mt-3 text-sm text-ink/60">No deductions recorded.</p>}
  </div></MemberLayout>
}
