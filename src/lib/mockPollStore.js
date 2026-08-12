// Real SAA-built voting poll (supabase/schema.sql: polls, poll_votes).
// Replaces the earlier localStorage-only prototype, which also targeted
// a hardcoded fake meeting id ('meeting-1') that could never match a
// real meeting and called getMeeting()/getAgenda() as if they were
// synchronous — both are real async Supabase calls now, so that version
// would throw as soon as "Build Poll from Agenda" was clicked. This
// version always targets the real next active meeting, same pattern as
// MOM/agenda.

import { supabase } from './supabaseClient.js'
import { getAccount } from './mockAuth.js'
import { findNextActiveMeeting, getMeetings } from './mockRolesStore.js'
import { getAgenda } from './mockAgendaStore.js'
import { pushNotification } from './mockNotificationsStore.js'

const LOG_KEY = 'toasty_poll_history'
const MAX_LOG_ENTRIES = 25

// Which agenda/role slots feed each category's starting candidate list.
// Best Table Topics Speaker has none — it's built live by the SAA during
// the meeting, per the brief.
const CATEGORY_TEMPLATE = [
  {
    id: 'best-speaker',
    title: 'Best Speaker',
    description: 'Which prepared speech stood out most tonight?',
    roleIds: ['speaker-1', 'speaker-2'],
  },
  {
    id: 'best-evaluator',
    title: 'Best Evaluator',
    description: 'Whose evaluation was most helpful and specific?',
    roleIds: ['evaluator-1', 'evaluator-2'],
  },
  {
    id: 'best-tagl',
    title: 'Best TAGL',
    description: 'Timer, Ah-Counter, Grammarian, or Listener — who stood out?',
    roleIds: ['timer', 'ah-counter', 'grammarian', 'listener'],
  },
  {
    id: 'best-main-role',
    title: 'Best Main Role-Taker',
    description: 'GE, TMOD, Table Topics Master, or Presiding Officer — who ran their part best?',
    roleIds: ['ge', 'tmod', 'ttm', 'po'],
  },
  {
    id: 'best-tt-speaker',
    title: 'Best Table Topics Speaker',
    description: 'Added live by the SAA during the meeting.',
    roleIds: [],
  },
]

function logAction(message) {
  const entry = { id: crypto.randomUUID(), message, time: new Date().toISOString() }
  try {
    const raw = localStorage.getItem(LOG_KEY)
    const existing = raw ? JSON.parse(raw) : []
    localStorage.setItem(
      LOG_KEY,
      JSON.stringify([entry, ...existing].slice(0, MAX_LOG_ENTRIES)),
    )
  } catch {
    localStorage.setItem(LOG_KEY, JSON.stringify([entry]))
  }
}

export function getPollHistory() {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function displayName(takenBy) {
  if (!takenBy) return null
  return takenBy === '__me__' ? 'You' : takenBy
}

function toPollView(row, meeting) {
  if (!row) return null
  return {
    id: row.id,
    meetingLabel: meeting.dateLabel,
    isOpen: row.is_open,
    releasedAt: row.released_at,
    closedAt: row.closed_at,
    categories: row.categories,
  }
}

async function targetMeeting() {
  const meetings = await getMeetings()
  return findNextActiveMeeting(meetings) ?? meetings[meetings.length - 1] ?? null
}

export async function getPoll() {
  const meeting = await targetMeeting()
  if (!meeting) return null
  const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq('meeting_id', meeting.id)
    .maybeSingle()
  if (error) console.error('[mockPollStore] getPoll failed:', error.message)
  return toPollView(data, meeting)
}

// Builds (or rebuilds) the poll's candidate lists from the agenda if it's
// been generated, otherwise straight from the meeting's confirmed roles.
// Rebuilding always resets isOpen/releasedAt/closedAt to a fresh draft —
// same behavior the original store had, not a new change.
export async function buildPollFromAgenda() {
  const meeting = await targetMeeting()
  if (!meeting) return null
  const agenda = await getAgenda(meeting.id)

  const categories = CATEGORY_TEMPLATE.map((cat) => {
    const candidates = cat.roleIds
      .map((roleId) => {
        if (agenda) {
          const item = agenda.items.find((i) => i.roleId === roleId)
          return item?.member || null
        }
        return displayName(meeting.roles[roleId]?.takenBy)
      })
      .filter(Boolean)
    return { id: cat.id, title: cat.title, description: cat.description, candidates }
  })

  const { data: existing } = await supabase
    .from('polls')
    .select('id')
    .eq('meeting_id', meeting.id)
    .maybeSingle()

  const { error } = await supabase.from('polls').upsert(
    {
      meeting_id: meeting.id,
      categories,
      is_open: false,
      released_at: null,
      closed_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'meeting_id' },
  )
  if (error) {
    console.error('[mockPollStore] buildPollFromAgenda failed:', error.message)
    return null
  }
  logAction(
    existing
      ? `SAA rebuilt the poll from ${agenda ? 'the agenda' : 'confirmed roles'}`
      : `SAA built the poll from ${agenda ? 'the agenda' : 'confirmed roles'} for ${meeting.dateLabel}`,
  )
  return getPoll()
}

export async function addCandidate(categoryId, name) {
  const trimmed = name.trim()
  if (!trimmed) return getPoll()
  const meeting = await targetMeeting()
  if (!meeting) return null
  const { data: row } = await supabase
    .from('polls')
    .select('*')
    .eq('meeting_id', meeting.id)
    .maybeSingle()
  if (!row) return null
  const categories = row.categories.map((cat) =>
    cat.id === categoryId && !cat.candidates.includes(trimmed)
      ? { ...cat, candidates: [...cat.candidates, trimmed] }
      : cat,
  )
  const { error } = await supabase.from('polls').update({ categories }).eq('id', row.id)
  if (error) {
    console.error('[mockPollStore] addCandidate failed:', error.message)
    return getPoll()
  }
  const cat = row.categories.find((c) => c.id === categoryId)
  logAction(`SAA added ${trimmed} to ${cat?.title ?? categoryId}`)
  return getPoll()
}

export async function removeCandidate(categoryId, name) {
  const meeting = await targetMeeting()
  if (!meeting) return null
  const { data: row } = await supabase
    .from('polls')
    .select('*')
    .eq('meeting_id', meeting.id)
    .maybeSingle()
  if (!row) return null
  const categories = row.categories.map((cat) =>
    cat.id === categoryId
      ? { ...cat, candidates: cat.candidates.filter((c) => c !== name) }
      : cat,
  )
  const { error } = await supabase.from('polls').update({ categories }).eq('id', row.id)
  if (error) {
    console.error('[mockPollStore] removeCandidate failed:', error.message)
    return getPoll()
  }
  const cat = row.categories.find((c) => c.id === categoryId)
  logAction(`SAA removed ${name} from ${cat?.title ?? categoryId}`)
  return getPoll()
}

export async function releasePoll() {
  const poll = await getPoll()
  if (!poll) return null
  const { error } = await supabase
    .from('polls')
    .update({ is_open: true, released_at: new Date().toISOString() })
    .eq('id', poll.id)
  if (error) {
    console.error('[mockPollStore] releasePoll failed:', error.message)
    return poll
  }
  logAction(`Poll released to members for ${poll.meetingLabel}`)
  pushNotification({
    type: 'poll_released',
    message: 'Voting poll is now open — cast your vote before the meeting ends.',
    link: '/poll',
  })
  return getPoll()
}

export async function closePoll() {
  const poll = await getPoll()
  if (!poll) return null
  const { error } = await supabase
    .from('polls')
    .update({ is_open: false, closed_at: new Date().toISOString() })
    .eq('id', poll.id)
  if (error) {
    console.error('[mockPollStore] closePoll failed:', error.message)
    return poll
  }
  logAction(`Poll closed for ${poll.meetingLabel}`)
  return getPoll()
}

export async function getVoteCounts(pollId) {
  if (!pollId) return {}
  const { data, error } = await supabase
    .from('poll_votes')
    .select('answers')
    .eq('poll_id', pollId)
  if (error) {
    console.error('[mockPollStore] getVoteCounts failed:', error.message)
    return {}
  }
  const counts = {}
  for (const row of data ?? []) {
    for (const [categoryId, candidate] of Object.entries(row.answers ?? {})) {
      if (!candidate) continue
      const tally = (counts[categoryId] ??= {})
      tally[candidate] = (tally[candidate] ?? 0) + 1
    }
  }
  return counts
}

export async function hasVoted(pollId) {
  if (!pollId) return false
  const account = getAccount()
  if (!account?.email) return false
  const { data, error } = await supabase
    .from('poll_votes')
    .select('id')
    .eq('poll_id', pollId)
    .eq('voter_email', account.email)
    .maybeSingle()
  if (error) console.error('[mockPollStore] hasVoted failed:', error.message)
  return !!data
}

export async function submitVote(pollId, answers) {
  const account = getAccount()
  const { error } = await supabase.from('poll_votes').insert({
    poll_id: pollId,
    voter_email: account?.email ?? null,
    answers,
  })
  if (error) console.error('[mockPollStore] submitVote failed:', error.message)
}

// For each category, the candidate(s) with the most votes — used for the
// results summary shown after the poll closes.
export async function getResultsSummary(poll) {
  if (!poll) return []
  const counts = await getVoteCounts(poll.id)
  return poll.categories.map((cat) => {
    const tally = counts[cat.id] ?? {}
    const entries = Object.entries(tally)
    if (entries.length === 0) {
      return { categoryId: cat.id, title: cat.title, winners: [], totalVotes: 0 }
    }
    const maxVotes = Math.max(...entries.map(([, count]) => count))
    const winners = entries.filter(([, count]) => count === maxVotes).map(([name]) => name)
    const totalVotes = entries.reduce((sum, [, count]) => sum + count, 0)
    return { categoryId: cat.id, title: cat.title, winners, votes: maxVotes, totalVotes }
  })
}
