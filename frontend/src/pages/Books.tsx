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

export default function Books() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
          </article>
        ))}
      </div>
    </main>
  )
}