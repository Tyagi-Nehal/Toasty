// Monthly award history (supabase/schema.sql: monthly_awards). Rows are
// written only by the record_monthly_awards() database function — never by
// the client — so calling it is safe to repeat from anywhere.

import { supabase } from './supabaseClient.js'

export async function recordMonthlyAwards() {
  const { error } = await supabase.rpc('record_monthly_awards')
  if (error) console.error('[mockAwardsStore] recordMonthlyAwards failed:', error.message)
}

// Newest month first, grouped: [{ monthStart, toastmasters: [], excom: [] }]
export async function getMonthlyAwards(clubId) {
  const { data, error } = await supabase
    .from('monthly_awards')
    .select('month_start, category, winner_name, winner_email, role, points')
    .eq('club_id', clubId)
    .order('month_start', { ascending: false })
  if (error) {
    console.error('[mockAwardsStore] getMonthlyAwards failed:', error.message)
    return []
  }
  const months = new Map()
  for (const row of data ?? []) {
    const entry = months.get(row.month_start) ?? {
      monthStart: row.month_start,
      toastmasters: [],
      excom: [],
    }
    const winner = {
      name: row.winner_name,
      email: row.winner_email,
      role: row.role,
      points: row.points,
    }
    if (row.category === 'best_toastmaster') entry.toastmasters.push(winner)
    else entry.excom.push(winner)
    months.set(row.month_start, entry)
  }
  return [...months.values()]
}
