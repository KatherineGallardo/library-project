import './App.css'
import { BrowserRouter, NavLink, Route, Routes, Navigate } from 'react-router-dom'
import { useAsgardeo } from '@asgardeo/react'
import { useEffect, useState, type ReactElement } from 'react'

import api, { setAccessToken } from './api'

import Home from './pages/Home'
import Books from './pages/Books'
import Login from './pages/Login'
import Reservations from './pages/Reservations'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import CompleteProfile from './pages/CompleteProfile'

function App() {
  const auth = useAsgardeo()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      if (!auth?.isSignedIn) {
        setAccessToken(null)
        setCurrentUser(null)
        setLoadingUser(false)
        return
      }

      try {
        const token = await auth.getAccessToken()
        setAccessToken(token)

        const res = await api.get('/api/me')
        setCurrentUser(res.data)
      } catch (err) {
        console.error('Error loading current user:', err)
        setAccessToken(null)
      } finally {
        setLoadingUser(false)
      }
    }

    loadUser()
  }, [auth?.isSignedIn])

  if (loadingUser) {
    return <div>Loading...</div>
  }

  const requireAuth = (element: ReactElement) => {
    if (!auth?.isSignedIn) return <Navigate to="/login" />
    return element
  }

  const requireLibrarian = (element: ReactElement) => {
    if (!auth?.isSignedIn) return <Navigate to="/login" />
    if (currentUser?.role !== 'librarian') return <Navigate to="/" />
    return element
  }

  const requireProfileComplete = (element: ReactElement) => {
    if (!auth?.isSignedIn) return element

    if (
      currentUser?.first_name === 'Pending' ||
      currentUser?.phone_number === 'Pending'
    ) {
      return <Navigate to="/complete-profile" />
    }

    return element
  }

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
              <NavLink to="/reservations">Reservations</NavLink>
              <NavLink to="/profile">My Account</NavLink>

              {currentUser?.role === 'librarian' && (
                <NavLink to="/admin">Librarian Dashboard</NavLink>
              )}
            </>
          )}

          {!auth?.isSignedIn ? (
            <NavLink to="/login">Sign In</NavLink>
          ) : (
            <button className="nav-button" onClick={() => auth?.signOut()}>
              Sign Out
            </button>
          )}
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/books" element={<Books />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/reservations"
          element={requireAuth(requireProfileComplete(<Reservations />))}
        />

        <Route path="/profile" element={requireAuth(<Profile />)} />

        <Route
          path="/admin"
          element={requireLibrarian(<AdminDashboard />)}
        />

        <Route
          path="/complete-profile"
          element={requireAuth(<CompleteProfile />)}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App