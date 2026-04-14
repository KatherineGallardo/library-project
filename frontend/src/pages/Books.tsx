import { useEffect, useState } from 'react'
import api from '../api'

interface Book {
  id: number
  title: string
  authorFirstName: string
  authorLastName: string
  yearPublished: number
  genre: string
  description: string
  availableCopies: number
}

export default function Books() {
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    api.get('/books').then((response) => setBooks(response.data)).catch(console.error)
  }, [])

  return (
    <main className="page-container">
      <h1>Book Catalog</h1>
      <div className="book-grid">
        {books.map((book) => (
          <article key={book.id} className="book-card">
            <h2>{book.title}</h2>
            <p>{book.authorFirstName} {book.authorLastName}</p>
            <p>{book.yearPublished}</p>
            <p>{book.genre}</p>
            <p>{book.description}</p>
            <span className={book.availableCopies > 0 ? 'badge available' : 'badge unavailable'}>
              {book.availableCopies > 0 ? 'Available' : 'Checked out'}
            </span>
          </article>
        ))}
      </div>
    </main>
  )
}
