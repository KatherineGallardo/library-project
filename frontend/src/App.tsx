import './App.css'
import { useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { useAsgardeo } from '@asgardeo/react'
import api, { setAccessToken } from './api'

import Home from './pages/Home'
import Books from './pages/Books'
import Login from './pages/Login'
import Reservations from './pages/Reservations'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import CompleteProfile from './pages/CompleteProfile'

interface CurrentUser {
  user_id: number
  first_name: string
  last_name: string
  role: 'patron' | 'librarian'
}

function App() {
  const auth = useAsgardeo()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    const loadAccessTokenAndUser = async () => {
      if (auth?.isLoading) {
        return
      }

      if (!auth?.isSignedIn) {
        setAccessToken(null)
        setCurrentUser(null)
        return
      }

      try {
        const token = await auth.getAccessToken()
        setAccessToken(token)

        const response = await api.get('/api/me')
        setCurrentUser(response.data)
      } catch (err) {
        console.error('Error loading access token or current user:', err)
        setAccessToken(null)
        setCurrentUser(null)
      }
    }

    loadAccessTokenAndUser()
  }, [auth?.isLoading, auth?.isSignedIn, auth])

  const isLibrarian = currentUser?.role === 'librarian'

  return (
    <BrowserRouter>
      <header className="app-header">
        <nav>
          <NavLink to="/" end>
            Home
          </NavLink>

          <NavLink to="/books">Books</NavLink>

          {auth?.isSignedIn && (
            <>
              <NavLink to="/reservations"> My Reservations</NavLink>
              <NavLink to="/profile">My Account</NavLink>

              {isLibrarian && (
                <NavLink to="/admin">Librarian</NavLink>
              )}
            </>
          )}

          {!auth?.isSignedIn ? (
            <NavLink to="/login">Sign In</NavLink>
          ) : (
            <button
              className="nav-button"
              onClick={() => {
                setAccessToken(null)
                setCurrentUser(null)
                auth?.signOut()
              }}
            >
              Sign Out
            </button>
          )}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<Books />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App