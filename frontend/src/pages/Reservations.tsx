import { useEffect, useState } from 'react'
import api from '../api'

interface Reservation {
  reservation_id: number
  user_id: number
  book_id: number
  check_out: string
  due_date: string
  check_in: string | null
  status: string
  book?: {
    title: string
  }
}

interface Book {
  book_id: number
  title: string
  availability: string
}

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBookId, setSelectedBookId] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const USER_ID = 2 // temporary hardcode

  const fetchData = async () => {
    try {
      setError('')

      const [resRes, bookRes] = await Promise.all([
        api.get('/reservations'),
        api.get('/books'),
      ])

      setReservations(resRes.data)
      setBooks(bookRes.data)
    } catch (err) {
      console.error(err)
      setError('Unable to load reservations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCheckout = async () => {
    if (!selectedBookId) return

    try {
      await api.post('/reservations', {
        user_id: USER_ID,
        book_id: selectedBookId,
      })

      setSelectedBookId('')
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Unable to check out book.')
    }
  }

  const handleReturn = async (reservation: Reservation) => {
    try {
      await api.put(`/reservations/${reservation.reservation_id}`, {
        check_in: new Date(),
      })

      fetchData()
    } catch (err) {
      console.error(err)
      setError('Unable to return book.')
    }
  }

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm('Delete this reservation?')
    if (!confirmDelete) return

    try {
      await api.delete(`/reservations/${id}`)
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Unable to delete reservation.')
    }
  }

  if (loading) {
    return (
      <main className="page-container">
        <h1>Reservations</h1>
        <p>Loading...</p>
      </main>
    )
  }

  return (
    <main className="page-container">
      <h1>Reservations</h1>

      {/* CHECKOUT SECTION */}
      <section className="book-form-section">
        <h2>Check Out a Book</h2>

        <div className="form-actions">
          <select
            value={selectedBookId}
            onChange={(e) => setSelectedBookId(Number(e.target.value))}
          >
            <option value="">Select a book</option>

            {books
              .filter((b) => b.availability === 'Available')
              .map((book) => (
                <option key={book.book_id} value={book.book_id}>
                  {book.title}
                </option>
              ))}
          </select>

          <button onClick={handleCheckout}>Check Out</button>
        </div>
      </section>

      {error && <p>{error}</p>}

      {/* RESERVATION LIST */}
      <div className="book-grid">
        {reservations.map((res) => (
          <article key={res.reservation_id} className="book-card">
            <h2>{res.book?.title ?? `Book ID: ${res.book_id}`}</h2>

            <div className="book-details">
              <p>
                <span className="label">Checked Out:</span>{' '}
                {new Date(res.check_out).toLocaleDateString()}
              </p>

              <p>
                <span className="label">Due:</span>{' '}
                {new Date(res.due_date).toLocaleDateString()}
              </p>

              <p>
                <span className="label">Returned:</span>{' '}
                {res.check_in
                  ? new Date(res.check_in).toLocaleDateString()
                  : 'Not returned'}
              </p>
            </div>

            <span
              className={
                res.status === 'checked_out'
                  ? 'badge available'
                  : res.status === 'overdue'
                  ? 'badge unavailable'
                  : 'badge'
              }
            >
              {res.status}
            </span>

            <div className="card-actions">
              {!res.check_in && (
                <button onClick={() => handleReturn(res)}>Return</button>
              )}

              <button onClick={() => handleDelete(res.reservation_id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}