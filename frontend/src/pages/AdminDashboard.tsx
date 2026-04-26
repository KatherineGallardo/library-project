import { useEffect, useState } from 'react'
import api from '../api'

interface User {
  user_id: number
  asgardeo_id: string
  first_name: string
  last_name: string
  role: string
  phone_number: string
  email: string
  date_of_birth: string
}

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

interface Reservation {
  reservation_id: number
  user_id: number
  book_id: number
  check_out: string | null
  due_date: string | null
  check_in: string | null
  status: string
  user?: {
    first_name: string
    last_name: string
  }
  book?: {
    title: string
  }
}

interface UserFormData {
  first_name: string
  last_name: string
  role: string
  phone_number: string
  email: string
  date_of_birth: string
  asgardeo_id: string
}

interface BookFormData {
  title: string
  author_first_name: string
  author_last_name: string
  year_published: string
  genre: string
  description: string
}

const emptyUserForm: UserFormData = {
  first_name: '',
  last_name: '',
  role: 'patron',
  phone_number: '',
  email: '',
  date_of_birth: '',
  asgardeo_id: '',
}

const emptyBookForm: BookFormData = {
  title: '',
  author_first_name: '',
  author_last_name: '',
  year_published: '',
  genre: '',
  description: '',
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [userForm, setUserForm] = useState<UserFormData>(emptyUserForm)
  const [bookForm, setBookForm] = useState<BookFormData>(emptyBookForm)

  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editingBookId, setEditingBookId] = useState<number | null>(null)

  const fetchData = async () => {
    try {
      setError('')

      const [usersResponse, booksResponse, reservationsResponse] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/books'),
        api.get('/api/reservations'),
      ])

      setUsers(usersResponse.data)
      setBooks(booksResponse.data)
      setReservations(reservationsResponse.data)
    } catch (err) {
      console.error(err)
      setError('Unable to load admin dashboard data right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleUserChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    setUserForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleBookChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setBookForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const resetUserForm = () => {
    setUserForm(emptyUserForm)
    setEditingUserId(null)
  }

  const resetBookForm = () => {
    setBookForm(emptyBookForm)
    setEditingBookId(null)
  }

  const handleEditUser = (user: User) => {
    setUserForm({
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone_number: user.phone_number,
      email: user.email ?? '',
      date_of_birth: user.date_of_birth,
      asgardeo_id: user.asgardeo_id,
    })
    setEditingUserId(user.user_id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEditBook = (book: Book) => {
    setBookForm({
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

  const handleUserSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      const payload = { ...userForm }

      if (editingUserId) {
        await api.put(`/api/users/${editingUserId}`, payload)
      } else {
        await api.post('/api/users', payload)
      }

      resetUserForm()
      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Unable to save user right now.')
    }
  }

  const handleBookSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      const payload = {
        ...bookForm,
        year_published: Number(bookForm.year_published),
      }

      if (editingBookId) {
        await api.put(`/api/books/${editingBookId}`, payload)
      } else {
        await api.post('/api/books', payload)
      }

      resetBookForm()
      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Unable to save book right now.')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this user?')
    if (!confirmed) return

    try {
      await api.delete(`/api/users/${userId}`)
      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Unable to delete user right now.')
    }
  }

  const handleDeleteBook = async (bookId: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this book?')
    if (!confirmed) return

    try {
      await api.delete(`/api/books/${bookId}`)
      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Unable to delete book right now.')
    }
  }

  const handleMarkCheckedOut = async (reservation: Reservation) => {
    try {
      const checkOutDate = new Date()
      const dueDate = new Date(checkOutDate)
      dueDate.setDate(dueDate.getDate() + 7)

      await api.put(`/api/reservations/${reservation.reservation_id}`, {
        check_out: checkOutDate,
        due_date: dueDate,
        check_in: null,
      })

      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Unable to mark reservation as checked out.')
    }
  }

  const handleReturn = async (reservation: Reservation) => {
    try {
      await api.put(`/api/reservations/${reservation.reservation_id}`, {
        check_in: new Date(),
      })

      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Unable to update reservation.')
    }
  }

  const handleDeleteReservation = async (id: number) => {
    const confirmed = window.confirm('Delete this reservation?')
    if (!confirmed) return

    try {
      await api.delete(`/api/reservations/${id}`)
      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Unable to delete reservation.')
    }
  }

  const formatStatus = (status: string) => {
    if (status === 'checked_out') return 'Checked Out'
    if (status === 'returned') return 'Returned'
    if (status === 'overdue') return 'Overdue'
    return status
  }

  if (loading) {
    return (
      <main className="page-container">
        <h1>Librarian Dashboard</h1>
        <p>Loading dashboard...</p>
      </main>
    )
  }

  return (
    <main className="page-container">
      <h1>Librarian Dashboard</h1>

      {error && <p>{error}</p>}

      <section className="dashboard-grid">
        <section className="book-form-section">
          <h2>{editingUserId ? 'Edit User' : 'Add User'}</h2>

          <form onSubmit={handleUserSubmit} className="book-form">
            <div className="form-field">
              <label>First Name</label>
              <input
                name="first_name"
                value={userForm.first_name}
                onChange={handleUserChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Last Name</label>
              <input
                name="last_name"
                value={userForm.last_name}
                onChange={handleUserChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Role</label>
              <select name="role" value={userForm.role} onChange={handleUserChange}>
                <option value="patron">Patron</option>
                <option value="librarian">Librarian</option>
              </select>
            </div>

            <div className="form-field">
              <label>Phone Number</label>
              <input
                name="phone_number"
                value={userForm.phone_number}
                onChange={handleUserChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Email</label>
              <input
                name="email"
                type="email"
                value={userForm.email}
                onChange={handleUserChange}
              />
            </div>

            <div className="form-field">
              <label>Date of Birth</label>
              <input
                name="date_of_birth"
                type="date"
                value={userForm.date_of_birth}
                onChange={handleUserChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Asgardeo ID</label>
              <input
                name="asgardeo_id"
                value={userForm.asgardeo_id}
                onChange={handleUserChange}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit">
                {editingUserId ? 'Update User' : 'Create User'}
              </button>

              {editingUserId && (
                <button type="button" onClick={resetUserForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="book-form-section">
          <h2>{editingBookId ? 'Edit Book' : 'Add Book'}</h2>

          <form onSubmit={handleBookSubmit} className="book-form">
            <div className="form-field">
              <label>Title</label>
              <input
                name="title"
                value={bookForm.title}
                onChange={handleBookChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Author First Name</label>
              <input
                name="author_first_name"
                value={bookForm.author_first_name}
                onChange={handleBookChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Author Last Name</label>
              <input
                name="author_last_name"
                value={bookForm.author_last_name}
                onChange={handleBookChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Year Published</label>
              <input
                name="year_published"
                type="number"
                value={bookForm.year_published}
                onChange={handleBookChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Genre</label>
              <input
                name="genre"
                value={bookForm.genre}
                onChange={handleBookChange}
                required
              />
            </div>

            <div className="form-field">
              <label>Description</label>
              <textarea
                name="description"
                value={bookForm.description}
                onChange={handleBookChange}
              />
            </div>

            <div className="form-actions">
              <button type="submit">
                {editingBookId ? 'Update Book' : 'Create Book'}
              </button>

              {editingBookId && (
                <button type="button" onClick={resetBookForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>
      </section>

      <section className="admin-section">
        <h2>Users</h2>

        <div className="admin-card-grid">
          {users.map((user) => (
            <article key={user.user_id} className="book-card">
              <h2>
                {user.first_name} {user.last_name}
              </h2>

              <div className="book-details">
                <p>
                  <span className="label">Role:</span> {user.role}
                </p>
                <p>
                  <span className="label">Email:</span> {user.email}
                </p>
                <p>
                  <span className="label">Phone:</span> {user.phone_number}
                </p>
                <p>
                  <span className="label">Date of Birth:</span> {user.date_of_birth}
                </p>
              </div>

              <div className="card-actions">
                <button onClick={() => handleEditUser(user)}>Edit</button>
                <button onClick={() => handleDeleteUser(user.user_id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>Books</h2>

        <div className="admin-card-grid">
          {books.map((book) => (
            <article key={book.book_id} className="book-card">
              <h2>{book.title}</h2>

              <div className="book-details">
                <p>
                  <span className="label">Author:</span> {book.author_first_name}{' '}
                  {book.author_last_name}
                </p>
                <p>
                  <span className="label">Published:</span> {book.year_published}
                </p>
                <p>
                  <span className="label">Genre:</span> {book.genre}
                </p>
                <p className="description">
                  <span className="label">Description:</span> {book.description}
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
                <button onClick={() => handleEditBook(book)}>Edit</button>
                <button onClick={() => handleDeleteBook(book.book_id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-section">
        <h2>Reservations</h2>

        <div className="admin-card-grid">
          {reservations.map((reservation) => (
            <article key={reservation.reservation_id} className="book-card">
              <h2>{reservation.book?.title ?? `Book ${reservation.book_id}`}</h2>

              <div className="book-details">
                <p>
                  <span className="label">Patron:</span>{' '}
                  {reservation.user
                    ? `${reservation.user.first_name} ${reservation.user.last_name}`
                    : `User ${reservation.user_id}`}
                </p>
                <p>
                  <span className="label">Checked Out:</span>{' '}
                  {reservation.check_out
                    ? new Date(reservation.check_out).toLocaleDateString()
                    : 'Not checked out'}
                </p>
                <p>
                  <span className="label">Due:</span>{' '}
                  {reservation.due_date
                    ? new Date(reservation.due_date).toLocaleDateString()
                    : 'No due date'}
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
                  reservation.status === 'overdue'
                    ? 'badge unavailable'
                    : reservation.status === 'returned'
                    ? 'badge available'
                    : 'badge'
                }
              >
                {formatStatus(reservation.status)}
              </span>

              <div className="card-actions">
                {reservation.check_in ? (
                  <button onClick={() => handleMarkCheckedOut(reservation)}>
                    Mark Checked Out
                  </button>
                ) : (
                  <button onClick={() => handleReturn(reservation)}>
                    Mark Returned
                  </button>
                )}

                <button
                  onClick={() =>
                    handleDeleteReservation(reservation.reservation_id)
                  }
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}