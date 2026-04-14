import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDatabase } from './models/index.js'
import booksRouter from './routes/books.js'
import usersRouter from './routes/users.js'
import reservationsRouter from './routes/reservations.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT ?? 4000)

app.use(cors())
app.use(express.json())

app.use('/api/books', booksRouter)
app.use('/api/users', usersRouter)
app.use('/api/reservations', reservationsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, async () => {
  await initDatabase()
  console.log(`Backend running on http://localhost:${PORT}`)
})
