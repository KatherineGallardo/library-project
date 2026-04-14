import { Router } from 'express'
import { Book } from '../models/index.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/', async (_req, res) => {
  const books = await Book.findAll()
  res.json(books)
})

router.get('/:id', async (req, res) => {
  const book = await Book.findByPk(Number(req.params.id))
  if (!book) {
    return res.status(404).json({ message: 'Book not found' })
  }
  res.json(book)
})

router.post('/', authenticateToken, requireRole(['librarian']), async (req, res) => {
  const book = await Book.create({
    title: req.body.title,
    authorFirstName: req.body.authorFirstName,
    authorLastName: req.body.authorLastName,
    yearPublished: req.body.yearPublished,
    genre: req.body.genre,
    description: req.body.description,
    totalCopies: req.body.totalCopies ?? 1,
    availableCopies: req.body.availableCopies ?? req.body.totalCopies ?? 1,
  })
  res.status(201).json(book)
})

router.put('/:id', authenticateToken, requireRole(['librarian']), async (req, res) => {
  const book = await Book.findByPk(Number(req.params.id))
  if (!book) {
    return res.status(404).json({ message: 'Book not found' })
  }

  await book.update({
    title: req.body.title ?? book.title,
    authorFirstName: req.body.authorFirstName ?? book.authorFirstName,
    authorLastName: req.body.authorLastName ?? book.authorLastName,
    yearPublished: req.body.yearPublished ?? book.yearPublished,
    genre: req.body.genre ?? book.genre,
    description: req.body.description ?? book.description,
    totalCopies: req.body.totalCopies ?? book.totalCopies,
    availableCopies: req.body.availableCopies ?? book.availableCopies,
  })

  res.json(book)
})

router.delete('/:id', authenticateToken, requireRole(['librarian']), async (req, res) => {
  const book = await Book.findByPk(Number(req.params.id))
  if (!book) {
    return res.status(404).json({ message: 'Book not found' })
  }
  await book.destroy()
  res.sendStatus(204)
})

export default router
