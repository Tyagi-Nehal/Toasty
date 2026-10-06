import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient.js'

// Polling also picks up date-based expirations, which emit no database event.
export function useActiveMemberCount(clubId) {
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!clubId) return
    let stopped = false
    let inFlight = false

    async function refresh() {
      if (stopped || inFlight || document.visibilityState === 'hidden') return
      inFlight = true
      try {
        const { data, error } = await supabase.rpc('get_active_member_count', { p_club_id: clubId })
        if (error) throw error
        const count = data === null ? NaN : Number(data)
        if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid member count')
        if (!stopped) setResult({ clubId, count })
      } catch {
        // Never substitute a registration estimate or turn a failed read into zero.
        if (!stopped) setResult({ clubId, count: null })
      } finally {
        inFlight = false
      }
    }

    refresh()
    const timer = window.setInterval(refresh, 30_000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      stopped = true
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [clubId])

  return result && result.clubId === clubId ? result.count : null
}
