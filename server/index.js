import express from 'express'
import cors from 'cors'
import clubsRouter from './routes/clubs.js'
import presidentsRouter from './routes/presidents.js'

const app = express()
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/clubs', clubsRouter)
app.use('/api/presidents', presidentsRouter)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Toasty API listening on http://localhost:${PORT}`)
})
