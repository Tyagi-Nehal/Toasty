import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function RoleAgendaDetails({ meetingId, roleId }) {
  const [value, setValue] = useState('')
  const [meaning, setMeaning] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const pending = useRef(false)
  const isTheme = roleId === 'tmod'
  useEffect(() => {
    let stopped = false
    supabase.from('agendas').select('theme,word_of_day,meaning').eq('meeting_id', meetingId).maybeSingle()
      .then(({ data, error: failure }) => {
        if (stopped) return
        if (failure) { setError('Could not load meeting details. Refresh the page to try again.'); return }
        setValue((isTheme ? data?.theme : data?.word_of_day) ?? '')
        setMeaning(data?.meaning ?? '')
        setLoading(false)
      }).catch(() => { if (!stopped) setError('Could not load meeting details. Refresh the page to try again.') })
    return () => { stopped = true }
  }, [meetingId, isTheme])
  async function submit(event) {
    event.preventDefault()
    if (pending.current) return
    pending.current = true; setSaving(true); setError(''); setSaved(false)
    try {
      if (!value.trim() || (!isTheme && !meaning.trim())) { setError('Please complete the fields before saving.'); return }
      const { error: failure } = await supabase.rpc('save_role_agenda_details', {
        p_meeting_id: meetingId, p_role: roleId, p_value: value.trim(), p_meaning: isTheme ? '' : meaning.trim(),
      })
      if (failure) throw failure
      setSaved(true)
    } catch (failure) {
      setError(failure.code === 'P0001' ? failure.message : 'Could not save. Please refresh and check that this role is still assigned to you.')
    } finally { pending.current = false; setSaving(false) }
  }
  const inputClass = 'mt-1 block w-full rounded-xl border border-accent/40 bg-cream px-3 py-2 text-sm'
  return <form onSubmit={submit} className="mt-4 border-t border-accent/30 pt-4">
    <fieldset disabled={loading || saving} className="space-y-3">
      <label className="block text-sm font-semibold">{isTheme ? 'Meeting theme' : 'Word of the Day'}
        <input required maxLength={200} value={value} onChange={(event) => { setValue(event.target.value); setSaved(false) }} className={inputClass} />
      </label>
      {!isTheme && <label className="block text-sm font-semibold">Meaning
        <textarea required maxLength={2000} rows={3} value={meaning} onChange={(event) => { setMeaning(event.target.value); setSaved(false) }} className={inputClass} />
      </label>}
      <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{loading ? 'Loading…' : saving ? 'Saving…' : isTheme ? 'Save theme' : 'Save Word of the Day'}</button>
      <p className="text-xs text-ink/60">Saved details appear in this meeting’s agenda. The VPE can also edit them.</p>
    </fieldset>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    {saved && <p role="status" className="mt-2 text-sm text-primary">Saved to the meeting agenda.</p>}
  </form>
}
