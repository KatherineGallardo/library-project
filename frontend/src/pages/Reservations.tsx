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

interface CurrentUser {
  user_id: number
  role: 'patron' | 'librarian'
}

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [selectedBookId, setSelectedBookId] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchData = async () => {
    try {
      setError('')
      setSuccess('')

      const bookRes = await api.get('/api/books')
      setBooks(bookRes.data)

      const userRes = await api.get('/api/me')
      setCurrentUser(userRes.data)

      const resRes = await api.get('/api/reservations')
      setReservations(resRes.data)
    } catch (err: any) {
      console.error(err)

      const backendMessage =
        err?.response?.data?.error || 'Unable to load reservations.'

      setError(backendMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCheckout = async () => {
    if (!selectedBookId) {
      setError('Please select a book to check out.')
      return
    }

    try {
      setError('')
      setSuccess('')

      await api.post('/api/reservations', {
        book_id: selectedBookId,
      })

      setSuccess('Book checked out successfully.')
      setSelectedBookId('')
      await fetchData()
    } catch (err: any) {
      console.error(err)

      const backendMessage =
        err?.response?.data?.error || 'Unable to check out book.'

      setError(backendMessage)
    }
  }

  const handleReturn = async (reservation: Reservation) => {
    try {
      setError('')
      setSuccess('')

      await api.put(`/api/reservations/${reservation.reservation_id}`, {
        check_in: new Date(),
      })

      setSuccess('Book returned successfully.')
      await fetchData()
    } catch (err: any) {
      console.error(err)

      const backendMessage =
        err?.response?.data?.error || 'Unable to return book.'

      setError(backendMessage)
    }
  }

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm('Delete this reservation?')
    if (!confirmDelete) return

    try {
      setError('')
      setSuccess('')

      await api.delete(`/api/reservations/${id}`)

      setSuccess('Reservation deleted successfully.')
      await fetchData()
    } catch (err: any) {
      console.error(err)

      const backendMessage =
        err?.response?.data?.error || 'Unable to delete reservation.'

      setError(backendMessage)
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

      <section className="book-form-section">
        <h2>Check Out a Book</h2>

        <div className="form-actions">
          <select
            value={selectedBookId}
            onChange={(e) =>
              setSelectedBookId(e.target.value ? Number(e.target.value) : '')
            }
          >
            <option value="">Select a book</option>

            {books
              .filter((book) => book.availability === 'Available')
              .map((book) => (
                <option key={book.book_id} value={book.book_id}>
                  {book.title}
                </option>
              ))}
          </select>

          <button onClick={handleCheckout}>Check Out</button>
        </div>
      </section>

      {success && <p className="success-message">{success}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="book-grid">
        {reservations.map((reservation) => (
          <article key={reservation.reservation_id} className="book-card">
            <h2>
              {reservation.book?.title ?? `Book ID: ${reservation.book_id}`}
            </h2>

            <div className="book-details">
              <p>
                <span className="label">Checked Out:</span>{' '}
                {new Date(reservation.check_out).toLocaleDateString()}
              </p>

              <p>
                <span className="label">Due:</span>{' '}
                {new Date(reservation.due_date).toLocaleDateString()}
              </p>

              <p>
                <span className="label">Returned:</span>{' '}
                {reservation.check_in
                  ? new Date(reservation.check_in).toLocaleDateString()
                  : 'Not returned'}
              </p>
            </div>

            <span
              className={
                reservation.status === 'checked_out'
                  ? 'badge available'
                  : reservation.status === 'overdue'
                  ? 'badge unavailable'
                  : 'badge'
              }
            >
              {reservation.status}
            </span>

            <div className="card-actions">
              {!reservation.check_in && (
                <button onClick={() => handleReturn(reservation)}>
                  Return
                </button>
              )}

              {currentUser?.role === 'librarian' && (
                <button
                  onClick={() => handleDelete(reservation.reservation_id)}
                >
                  Delete
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}