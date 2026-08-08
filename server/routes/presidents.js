import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

// Maps a DB row (snake_case) to the exact shape the frontend already
// expects (camelCase) — matches the old mock object shape one-for-one.
function toPresident(row) {
  return {
    id: row.id,
    name: row.name,
    memberId: row.member_id,
    clubName: row.club_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    submittedAt: row.submitted_at,
  }
}

router.post('/', async (req, res) => {
  const { name, memberId, clubName, email, phone } = req.body
  const normalizedEmail = (email ?? '').trim().toLowerCase()
  const [result] = await pool.query(
    `INSERT INTO president_verifications (name, member_id, club_name, email, phone)
     VALUES (?, ?, ?, ?, ?)`,
    [name, memberId, clubName, normalizedEmail, phone],
  )
  const [rows] = await pool.query(
    'SELECT * FROM president_verifications WHERE id = ?',
    [result.insertId],
  )
  res.status(201).json(toPresident(rows[0]))
})

router.get('/pending', async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM president_verifications WHERE status = 'pending' ORDER BY submitted_at ASC",
  )
  res.json(rows.map(toPresident))
})

router.patch('/:id/approve', async (req, res) => {
  await pool.query("UPDATE president_verifications SET status = 'approved' WHERE id = ?", [
    req.params.id,
  ])
  res.status(204).end()
})

router.patch('/:id/reject', async (req, res) => {
  await pool.query("UPDATE president_verifications SET status = 'rejected' WHERE id = ?", [
    req.params.id,
  ])
  res.status(204).end()
})

router.get('/verify', async (req, res) => {
  const email = (req.query.email ?? '').trim().toLowerCase()
  if (!email) return res.json({ verified: false, name: null })
  const [rows] = await pool.query(
    "SELECT name FROM president_verifications WHERE status = 'approved' AND email = ? LIMIT 1",
    [email],
  )
  res.json({ verified: rows.length > 0, name: rows[0]?.name ?? null })
})

export default router
