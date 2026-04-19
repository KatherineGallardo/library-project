import { useEffect, useState } from 'react'
import api from '../api'

interface Book {
  book_id: number
  title: string
  author_first_name: string
  author_last_name: string
  year_published: number
  genre: string
  description: string
  availability: string
}

interface BookFormData {
  title: string
  author_first_name: string
  author_last_name: string
  year_published: string
  genre: string
  description: string
}

const emptyForm: BookFormData = {
  title: '',
  author_first_name: '',
  author_last_name: '',
  year_published: '',
  genre: '',
  description: '',
}

export default function Books() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<BookFormData>(emptyForm)
  const [editingBookId, setEditingBookId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchBooks = async () => {
    try {
      setError('')
      const response = await api.get('/books')
      setBooks(response.data)
    } catch (err) {
      console.error(err)
      setError('Unable to load books right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooks()
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingBookId(null)
  }

  const handleEdit = (book: Book) => {
    setFormData({
      title: book.title,
      author_first_name: book.author_first_name,
      author_last_name: book.author_last_name,
      year_published: String(book.year_published),
      genre: book.genre,
      description: book.description ?? '',
    })
    setEditingBookId(book.book_id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitting(true)

      const payload = {
        ...formData,
        year_published: Number(formData.year_published),
      }

      if (editingBookId) {
        await api.put(`/books/${editingBookId}`, payload)
      } else {
        await api.post('/books', payload)
      }

      resetForm()
      await fetchBooks()
    } catch (err) {
      console.error(err)
      setError('Unable to save book.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm('Delete this book?')
    if (!confirmDelete) return

    try {
      await api.delete(`/books/${id}`)
      await fetchBooks()
    } catch (err) {
      console.error(err)
      setError('Unable to delete book.')
    }
  }

  if (loading) {
    return (
      <main className="page-container">
        <h1>Book Catalog</h1>
        <p>Loading books...</p>
      </main>
    )
  }

  return (
    <main className="page-container">
      <h1>Book Catalog</h1>

      {/* FORM */}
      <section className="book-form-section">
        <h2>{editingBookId ? 'Edit Book' : 'Add New Book'}</h2>

        <form onSubmit={handleSubmit} className="book-form">
          <input
            name="title"
            placeholder="Title"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <input
            name="author_first_name"
            placeholder="Author First Name"
            value={formData.author_first_name}
            onChange={handleChange}
            required
          />

          <input
            name="author_last_name"
            placeholder="Author Last Name"
            value={formData.author_last_name}
            onChange={handleChange}
            required
          />

          <input
            name="year_published"
            type="number"
            placeholder="Year Published"
            value={formData.year_published}
            onChange={handleChange}
            required
          />

          <input
            name="genre"
            placeholder="Genre"
            value={formData.genre}
            onChange={handleChange}
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
          />

          <div className="form-actions">
            <button type="submit" disabled={submitting}>
              {editingBookId ? 'Update Book' : 'Create Book'}
            </button>

            {editingBookId && (
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {error && <p>{error}</p>}

      {/* BOOK LIST */}
      <div className="book-grid">
        {books.map((book) => (
          <article key={book.book_id} className="book-card">
            <h2>{book.title}</h2>

            <div className="book-details">
              <p>
                <span className="label">Author:</span>{' '}
                {book.author_first_name} {book.author_last_name}
              </p>

              <p>
                <span className="label">Published:</span>{' '}
                {book.year_published}
              </p>

              <p>
                <span className="label">Genre:</span> {book.genre}
              </p>

              <p className="description">
                <span className="label">Description:</span>{' '}
                {book.description}
              </p>
            </div>

            <span
              className={
                book.availability === 'Available'
                  ? 'badge available'
                  : 'badge unavailable'
              }
            >
              {book.availability}
            </span>

            <div className="card-actions">
              <button onClick={() => handleEdit(book)}>Edit</button>
              <button onClick={() => handleDelete(book.book_id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}