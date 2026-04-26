import './App.css'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { useAsgardeo } from '@asgardeo/react'

import Home from './pages/Home'
import Books from './pages/Books'
import Login from './pages/Login'
import Reservations from './pages/Reservations'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import CompleteProfile from './pages/CompleteProfile'

function App() {
  const auth = useAsgardeo()

  return (
    <BrowserRouter>
      <header className="app-header">
        <nav>
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/books">Books</NavLink>

          {/* Only show these when signed in */}
          {auth?.isSignedIn && (
            <>
              <NavLink to="/reservations">Reservations</NavLink>
              <NavLink to="/profile">My Account</NavLink>
              <NavLink to="/admin">Librarian</NavLink>
            </>
          )}

          {/* Auth buttons */}
          {!auth?.isSignedIn ? (
            <NavLink to="/login">Sign In</NavLink>
          ) : (
            <button
              className="nav-button"
              onClick={() => auth?.signOut()}
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