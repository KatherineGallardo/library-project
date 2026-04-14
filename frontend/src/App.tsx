import './App.css'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Books from './pages/Books'
import Login from './pages/Login'
import Reservations from './pages/Reservations'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <BrowserRouter>
      <header className="app-header">
        <nav>
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/books">Books</NavLink>
          <NavLink to="/reservations">Reservations</NavLink>
          <NavLink to="/profile">My Account</NavLink>
          <NavLink to="/admin">Librarian</NavLink>
          <NavLink to="/login">Sign In</NavLink>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<Books />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App