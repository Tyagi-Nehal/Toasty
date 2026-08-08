import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Maps a DB row (snake_case) to the exact shape the frontend already
// expects (camelCase) — matches the old mock object shape one-for-one.
function toClub(row) {
  return {
    id: row.id,
    name: row.name,
    clubId: row.club_id,
    district: row.district,
    area: row.area,
    members: row.members,
    foundedYear: row.founded_year,
    city: row.city,
    country: row.country,
    location: row.location,
    presidentName: row.president_name,
    presidentEmail: row.president_email,
    meetingDay: row.meeting_day,
    meetingTime: row.meeting_time,
    meetingLocation: row.meeting_location,
    status: row.status,
    submittedAt: row.submitted_at,
  }
}

router.get('/pending', async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM clubs WHERE status = 'pending' ORDER BY submitted_at ASC",
  )
  res.json(rows.map(toClub))
})

router.get('/', async (req, res) => {
  const status = req.query.status || 'approved'
  const [rows] = await pool.query('SELECT * FROM clubs WHERE status = ?', [status])
  res.json(rows.map(toClub))
})

router.get('/:id', async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM clubs WHERE id = ? AND status = 'approved'",
    [req.params.id],
  )
  if (rows.length === 0) return res.status(404).json(null)
  res.json(toClub(rows[0]))
})

router.post('/', async (req, res) => {
  const {
    name,
    presidentEmail,
    clubName,
    clubId,
    district,
    area,
    memberCount,
    foundedYear,
    city,
    country,
    meetingDay,
    meetingTime,
    meetingLocation,
  } = req.body

  const normalizedEmail = (presidentEmail ?? '').trim().toLowerCase()
  const [verified] = await pool.query(
    "SELECT 1 FROM president_verifications WHERE status = 'approved' AND email = ? LIMIT 1",
    [normalizedEmail],
  )
  if (verified.length === 0) {
    return res.status(403).json({ error: 'You are not a registered president.' })
  }

  const id = slugify(clubName)
  await pool.query(
    `INSERT INTO clubs
       (id, name, club_id, district, area, members, founded_year, city, country,
        location, president_name, president_email, meeting_day, meeting_time, meeting_location)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      clubName,
      clubId,
      district,
      area,
      Number(memberCount) || 0,
      foundedYear,
      city,
      country,
      `${city}, ${country}`,
      name,
      normalizedEmail,
      meetingDay,
      meetingTime,
      meetingLocation,
    ],
  )
  const [rows] = await pool.query('SELECT * FROM clubs WHERE id = ?', [id])
  res.status(201).json(toClub(rows[0]))
})

router.patch('/:id/approve', async (req, res) => {
  await pool.query("UPDATE clubs SET status = 'approved' WHERE id = ?", [req.params.id])
  res.status(204).end()
})

router.patch('/:id/reject', async (req, res) => {
  await pool.query("UPDATE clubs SET status = 'rejected' WHERE id = ?", [req.params.id])
  res.status(204).end()
})

export default router
