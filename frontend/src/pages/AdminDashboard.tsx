// NOTE: Updated to address MVP feedback by adding user-facing success messages.
// Ensures clear confirmation after CRUD operations and improves overall user experience.
import { useEffect, useState } from 'react'
import { useAsgardeo } from '@asgardeo/react'
import api, { setAccessToken } from '../api'

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
  user?: { first_name: string; last_name: string }
  book?: { title: string }
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
  const auth = useAsgardeo()

  const [users, setUsers] = useState<User[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // New state for success messages
  const [success, setSuccess] = useState('')

  const [userForm, setUserForm] = useState<UserFormData>(emptyUserForm)
  const [bookForm, setBookForm] = useState<BookFormData>(emptyBookForm)

  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editingBookId, setEditingBookId] = useState<number | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const booksResponse = await api.get('/api/books')
      setBooks(booksResponse.data)

      const usersResponse = await api.get('/api/users')
      setUsers(usersResponse.data)

      try {
        const reservationsResponse = await api.get('/api/reservations')
        setReservations(reservationsResponse.data)
      } catch (reservationErr: any) {
        console.error('Reservations load error:', reservationErr)

        setReservations([])
        setError(
          `${reservationErr?.response?.status || 'No status'}: ${
            reservationErr?.response?.data?.error ||
            reservationErr?.response?.data?.detail ||
            'Unable to load reservations.'
          }`
        )
      }
    } catch (err: any) {
      console.error('Admin dashboard load error:', err)

      setError(
        `${err?.response?.status || 'No status'}: ${
          err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          'Unable to load admin dashboard.'
        }`
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const loadAdminDashboard = async () => {
      if (auth?.isLoading) return

      if (!auth?.isSignedIn) {
        setAccessToken(null)
        setError('Please sign in to view the librarian dashboard.')
        setLoading(false)
        return
      }

      try {
        const token = await auth.getAccessToken()
        setAccessToken(token)
        await fetchData()
      } catch (err: any) {
        console.error('Admin auth error:', err)
        setError(err?.message || 'Unable to authenticate librarian dashboard.')
        setLoading(false)
      }
    }

    loadAdminDashboard()
  }, [auth?.isLoading, auth?.isSignedIn])

  const userHasCurrentReservations = (userId: number) => {
    return reservations.some(
      (reservation) => reservation.user_id === userId && !reservation.check_in
    )
  }

  const getUserCurrentReservationCount = (userId: number) => {
    return reservations.filter(
      (reservation) => reservation.user_id === userId && !reservation.check_in
    ).length
  }

  const bookHasCurrentReservations = (bookId: number) => {
    return reservations.some(
      (reservation) => reservation.book_id === bookId && !reservation.check_in
    )
  }

  const handleUserChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target
    setUserForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleBookChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setBookForm((prev) => ({ ...prev, [name]: value }))
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
      setError('')
      setSuccess('')

      const payload = {
        ...userForm,
        email: userForm.email || null,
      }

      if (editingUserId) {
        await api.put(`/api/users/${editingUserId}`, payload)
        setSuccess('User updated successfully.')
      } else {
        await api.post('/api/users', payload)
        setSuccess('User created successfully.')
      }     

      resetUserForm()
      await fetchData()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.error || 'Unable to save user right now.')
    }
  }

  const handleBookSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      setError('')
      setSuccess('')

      const payload = {
        ...bookForm,
        year_published: Number(bookForm.year_published),
      }

      if (editingBookId) {
        await api.put(`/api/books/${editingBookId}`, payload)
        setSuccess('Book updated successfully.')
      } else {
        await api.post('/api/books', payload)
        setSuccess('Book created successfully.')
      }

      resetBookForm()
      await fetchData()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.error || 'Unable to save book right now.')
    }
  }

  const handleDeleteUser = async (userId: number, fullName: string) => {
    setError('')
    setSuccess('')

    if (userHasCurrentReservations(userId)) {
      setError(
        `${fullName} cannot be deleted because they currently have an active reservation. Mark the reservation as returned before deleting this user.`
      )
      return
    }

    const typedConfirmation = window.prompt(
      `Type DELETE to confirm you want to delete ${fullName}. This action cannot be undone.`
    )

    if (typedConfirmation !== 'DELETE') return

    try {
      const response = await api.delete(`/api/users/${userId}`)
      setSuccess(response.data.message || 'User deleted successfully.')
      await fetchData()
    } catch (err: any) {
      console.error(err)
      setError(
        err.response?.data?.error ||
          `${fullName} could not be deleted. Please make sure this user does not have any current reservations.`
      )
    }
  }

  const handleDeleteBook = async (bookId: number, title: string) => {
    setError('')
    setSuccess('')

    if (bookHasCurrentReservations(bookId)) {
      setError(
        `"${title}" cannot be deleted because it is currently checked out. Mark the reservation as returned before deleting this book.`
      )
      return
    }

    const typedConfirmation = window.prompt(
      `Type DELETE to confirm you want to delete "${title}". This action cannot be undone.`
    )

    if (typedConfirmation !== 'DELETE') return

    try {
      const response = await api.delete(`/api/books/${bookId}`)
      setSuccess(response.data.message || 'Book deleted successfully.')
      await fetchData()
    } catch (err: any) {
      console.error(err)
      setError(
        err.response?.data?.error ||
          `"${title}" could not be deleted. Please make sure this book is not currently checked out.`
      )
    }
  }

  const handleMarkCheckedOut = async (reservation: Reservation) => {
    try {
      setError('')
      setSuccess('')

      const checkOutDate = new Date()
      const dueDate = new Date(checkOutDate)
      dueDate.setDate(dueDate.getDate() + 7)

      await api.put(`/api/reservations/${reservation.reservation_id}`, {
        check_out: checkOutDate,
        due_date: dueDate,
        check_in: null,
      })
      
      setSuccess('Reservation marked as checked out.')
      await fetchData()
    } catch (err: any) {
      console.error(err)
      setError(
        err.response?.data?.error || 'Unable to mark reservation as checked out.'
      )
    }
  }

  const handleReturn = async (reservation: Reservation) => {
    try {
      setError('')
      setSuccess('')

      await api.put(`/api/reservations/${reservation.reservation_id}`, {
        check_in: new Date(),
      })

      setSuccess('Reservation marked as returned.')
      await fetchData()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.error || 'Unable to update reservation.')
    }
  }

  const handleDeleteReservation = async (id: number) => {
    setError('')
    setSuccess('')

    const confirmed = window.confirm(
      'Are you sure you want to delete this reservation? This action cannot be undone.'
    )

    if (!confirmed) return

    try {
      const response = await api.delete(`/api/reservations/${id}`)
      setSuccess(response.data.message || 'Reservation deleted successfully.')
      await fetchData()
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.error || 'Unable to delete reservation.')
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

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      <section className="dashboard-grid">
        <section className="book-form-section">
          <h2>{editingUserId ? 'Edit User' : 'Add User'}</h2>

          <form onSubmit={handleUserSubmit} className="book-form">
            <div className="form-field">
              <label>First Name</label>
              <input name="first_name" value={userForm.first_name} onChange={handleUserChange} required />
            </div>

            <div className="form-field">
              <label>Last Name</label>
              <input name="last_name" value={userForm.last_name} onChange={handleUserChange} required />
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
              <input name="phone_number" value={userForm.phone_number} onChange={handleUserChange} required />
            </div>

            <div className="form-field">
              <label>Email</label>
              <input name="email" type="email" value={userForm.email} onChange={handleUserChange} />
            </div>

            <div className="form-field">
              <label>Date of Birth</label>
              <input name="date_of_birth" type="date" value={userForm.date_of_birth} onChange={handleUserChange} required />
            </div>

            <div className="form-field">
              <label>Asgardeo ID</label>
              <input name="asgardeo_id" value={userForm.asgardeo_id} onChange={handleUserChange} required />
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
              <input name="title" value={bookForm.title} onChange={handleBookChange} required />
            </div>

            <div className="form-field">
              <label>Author First Name</label>
              <input name="author_first_name" value={bookForm.author_first_name} onChange={handleBookChange} required />
            </div>

            <div className="form-field">
              <label>Author Last Name</label>
              <input name="author_last_name" value={bookForm.author_last_name} onChange={handleBookChange} required />
            </div>

            <div className="form-field">
              <label>Year Published</label>
              <input name="year_published" type="number" value={bookForm.year_published} onChange={handleBookChange} required />
            </div>

            <div className="form-field">
              <label>Genre</label>
              <input name="genre" value={bookForm.genre} onChange={handleBookChange} required />
            </div>

            <div className="form-field">
              <label>Description</label>
              <textarea name="description" value={bookForm.description} onChange={handleBookChange} />
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

        {users.length === 0 ? (
          <p>No users loaded.</p>
        ) : (
          <div className="admin-card-grid">
            {users.map((user) => (
            <article key={user.user_id} className="book-card">
            <h2>{user.first_name} {user.last_name}</h2>

            <div className="book-details">
            <p><span className="label">Role:</span> {user.role}</p>
            <p><span className="label">Email:</span> {user.email || 'No email'}</p>
            <p><span className="label">Phone:</span> {user.phone_number}</p>
            <p><span className="label">Date of Birth:</span> {user.date_of_birth}</p>
          </div>

          <div className="card-actions">
          <button type="button" onClick={() => handleEditUser(user)}>Edit</button>
          </div>
          </article>
    ))}
            
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2>Books</h2>

        {books.length === 0 ? (
          <p>No books loaded.</p>
        ) : (
          <div className="admin-card-grid">
            {books.map((book) => {
              
              return (
                    <article key={book.book_id} className="book-card">
                    <h2>{book.title}</h2>

                    <div className="book-details">
                    <p><span className="label">Author:</span> {book.author_first_name} {book.author_last_name}</p>
                    <p><span className="label">Published:</span> {book.year_published}</p>
                    <p><span className="label">Genre:</span> {book.genre}</p>
                    <p className="description"><span className="label">Description:</span> {book.description || 'No description'}</p>
                    </div>

                      <span className={book.availability === 'Available' ? 'badge available' : 'badge unavailable'}>
                       {book.availability}
                      </span>

                      <div className="card-actions">
                       <button type="button" onClick={() => handleEditBook(book)}>Edit</button>
                       </div>
                    </article>
                      )   
            })}
          </div>
        )}
      </section>

      <section className="admin-section">
        <h2>Reservations</h2>

        {reservations.length === 0 ? (
          <p>No reservations loaded.</p>
        ) : (
          <div className="admin-card-grid">
            {reservations.map((reservation) => (
              <article key={reservation.reservation_id} className="book-card">
                <h2>{reservation.book?.title ?? `Book ${reservation.book_id}`}</h2>

                <div className="book-details">
                  <p><span className="label">Patron:</span> {reservation.user ? `${reservation.user.first_name} ${reservation.user.last_name}` : `User ${reservation.user_id}`}</p>
                  <p><span className="label">Checked Out:</span> {reservation.check_out ? new Date(reservation.check_out).toLocaleDateString() : 'Not checked out'}</p>
                  <p><span className="label">Due:</span> {reservation.due_date ? new Date(reservation.due_date).toLocaleDateString() : 'No due date'}</p>
                  <p><span className="label">Returned:</span> {reservation.check_in ? new Date(reservation.check_in).toLocaleDateString() : 'Not returned'}</p>
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
                    <button type="button" onClick={() => handleMarkCheckedOut(reservation)}>
                      Mark Checked Out
                    </button>
                  ) : (
                    <button type="button" onClick={() => handleReturn(reservation)}>
                      Mark Returned
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteReservation(reservation.reservation_id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}