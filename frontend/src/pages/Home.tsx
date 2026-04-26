/*
import { Link, NavLink } from 'react-router-dom'

export default function Home() {
  return (
    <main className="page-container">
      <section className="home-hero">
        <h1>LibraryOS</h1>
        <p className="home-subtitle">
          A simple system to explore books, manage reservations, and track availability.
        </p>

        <div className="button-group">
          <Link to="/books" className="primary-btn">
            Browse Books
          </Link>

          <Link to="/login" className="secondary-btn">
            Sign In
          </Link>
        </div>
      </section>

      <section className="home-features">
        <NavLink to="/books" className="feature-card">
          <h3>Browse</h3>
          <p>Explore available books and view details before reserving.</p>
        </NavLink>

        <NavLink to="/reservations" className="feature-card">
          <h3>Reserve</h3>
          <p>Check out books and track due dates in one place.</p>
        </NavLink>

        <NavLink to="/profile" className="feature-card">
          <h3>Manage</h3>
          <p>Update your account and monitor your reading activity.</p>
        </NavLink>
      </section>
    </main>
  )
}
*/

import { useState } from 'react'
import { useAsgardeo } from '@asgardeo/react'
import api from '../api'

export default function Home() {
  const auth = useAsgardeo()
  const [message, setMessage] = useState('')

  const testBackendAuth = async () => {
    try {
      const token = await auth.getAccessToken()

      const response = await api.get('/auth-test', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setMessage(response.data.message)
    } catch (err) {
      console.error(err)
      setMessage('Backend auth test failed.')
    }
  }

  return (
    <main className="page-container">
      <h1>Library Project</h1>
      <p>Welcome to the library catalog.</p>

      {auth?.isSignedIn && (
        <button onClick={testBackendAuth}>
          Test Backend Auth
        </button>
      )}

      {message && <p>{message}</p>}
    </main>
  )
}