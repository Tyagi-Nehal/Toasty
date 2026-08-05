// Shared source of truth for the current meeting's voting poll — built by
// the SAA-facing Poll Editor and read by the member-facing Voting Poll
// page, so releasing/closing the poll and casting votes are reflected on
// both sides. Persisted to localStorage like the other shared mock stores
// (mockAgendaStore.js, mockRolesStore.js).

import { getMeeting } from './mockRolesStore.js'
import { getAgenda } from './mockAgendaStore.js'
import { pushNotification } from './mockNotificationsStore.js'

const STATE_KEY = 'toasty_poll'
const VOTES_KEY = 'toasty_poll_votes'
const VOTED_PREFIX = 'toasty_poll_voted_'
const LOG_KEY = 'toasty_poll_history'
const MAX_LOG_ENTRIES = 25

const MEETING_ID = 'meeting-1'
const POLL_ID = `poll-${MEETING_ID}`

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

function displayName(takenBy) {
  if (!takenBy) return null
  return takenBy === '__me__' ? 'You' : takenBy
}

function readState() {
  try {
    const raw = localStorage.getItem(STATE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state))
}

function readVotes() {
  try {
    const raw = localStorage.getItem(VOTES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeVotes(votes) {
  localStorage.setItem(VOTES_KEY, JSON.stringify(votes))
}

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

// Builds (or rebuilds) the poll's candidate lists from the agenda if it's
// been generated, otherwise straight from the meeting's confirmed roles.
export function buildPollFromAgenda() {
  const meeting = getMeeting(MEETING_ID)
  const agenda = getAgenda()

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

  const existing = readState()
  const state = {
    id: POLL_ID,
    meetingLabel: meeting.dateLabel,
    isOpen: false,
    releasedAt: null,
    closedAt: null,
    categories,
  }
  writeState(state)
  logAction(
    existing
      ? `SAA rebuilt the poll from ${agenda ? 'the agenda' : 'confirmed roles'}`
      : `SAA built the poll from ${agenda ? 'the agenda' : 'confirmed roles'} for ${meeting.dateLabel}`,
  )
  return state
}

export function getPoll() {
  return readState()
}

export function addCandidate(categoryId, name) {
  const state = readState()
  if (!state || !name.trim()) return state
  const trimmed = name.trim()
  const next = {
    ...state,
    categories: state.categories.map((cat) =>
      cat.id === categoryId && !cat.candidates.includes(trimmed)
        ? { ...cat, candidates: [...cat.candidates, trimmed] }
        : cat,
    ),
  }
  writeState(next)
  const cat = state.categories.find((c) => c.id === categoryId)
  logAction(`SAA added ${trimmed} to ${cat?.title ?? categoryId}`)
  return next
}

export function removeCandidate(categoryId, name) {
  const state = readState()
  if (!state) return state
  const next = {
    ...state,
    categories: state.categories.map((cat) =>
      cat.id === categoryId
        ? { ...cat, candidates: cat.candidates.filter((c) => c !== name) }
        : cat,
    ),
  }
  writeState(next)
  const cat = state.categories.find((c) => c.id === categoryId)
  logAction(`SAA removed ${name} from ${cat?.title ?? categoryId}`)
  return next
}

export function releasePoll() {
  const state = readState()
  if (!state) return state
  const next = { ...state, isOpen: true, releasedAt: new Date().toISOString() }
  writeState(next)
  logAction(`Poll released to members for ${state.meetingLabel}`)
  pushNotification({
    type: 'poll_released',
    message: 'Voting poll is now open — cast your vote before the meeting ends.',
    link: '/poll',
  })
  return next
}

export function closePoll() {
  const state = readState()
  if (!state) return state
  const next = { ...state, isOpen: false, closedAt: new Date().toISOString() }
  writeState(next)
  logAction(`Poll closed for ${state.meetingLabel}`)
  return next
}

export function getVoteCounts() {
  const votes = readVotes()[POLL_ID] ?? {}
  return votes
}

export function hasVoted() {
  return localStorage.getItem(VOTED_PREFIX + POLL_ID) === 'true'
}

export function submitVote(answers) {
  const state = readState()
  if (!state) return
  const allVotes = readVotes()
  const pollVotes = { ...(allVotes[POLL_ID] ?? {}) }
  for (const [categoryId, candidate] of Object.entries(answers)) {
    if (!candidate) continue
    const tally = { ...(pollVotes[categoryId] ?? {}) }
    tally[candidate] = (tally[candidate] ?? 0) + 1
    pollVotes[categoryId] = tally
  }
  allVotes[POLL_ID] = pollVotes
  writeVotes(allVotes)
  localStorage.setItem(VOTED_PREFIX + POLL_ID, 'true')
}

// For each category, the candidate(s) with the most votes — used for the
// results summary shown after the poll closes.
export function getResultsSummary() {
  const state = readState()
  if (!state) return []
  const counts = getVoteCounts()
  return state.categories.map((cat) => {
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
