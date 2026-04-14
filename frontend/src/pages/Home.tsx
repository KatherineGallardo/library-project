import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main className="page-container">
      <section>
        <h1>Welcome to LibraryOS</h1>
        <p>Browse titles, manage reservations, and check book availability.</p>
        <div className="button-group">
          <Link to="/books" className="primary-btn">
            Browse Books
          </Link>
          <Link to="/login" className="secondary-btn">
            Sign In
          </Link>
        </div>
      </section>
    </main>
  )
}
