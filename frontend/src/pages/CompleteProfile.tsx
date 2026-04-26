import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsgardeo } from '@asgardeo/react'
import api from '../api'

export default function CompleteProfile() {
  const auth = useAsgardeo()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    date_of_birth: '',
  })

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
  event.preventDefault()

  try {
    setSaving(true)
    setError('')

    const token = await auth.getAccessToken()

    await api.put('/me', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    navigate('/profile')
  } catch (err) {
    console.error(err)
    setError('Unable to save profile right now.')
  } finally {
    setSaving(false)
  }
}

  return (
    <main className="page-container">
      <h1>Complete Your Profile</h1>
      <p>Please finish setting up your account before using the library system.</p>

      <form onSubmit={handleSubmit} className="book-form">
        <div className="form-field">
          <label htmlFor="first_name">First Name</label>
          <input
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="last_name">Last Name</label>
          <input
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="phone_number">Phone Number</label>
          <input
            id="phone_number"
            name="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="form-field">
          <label htmlFor="date_of_birth">Date of Birth</label>
          <input
            id="date_of_birth"
            name="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {error && <p>{error}</p>}
    </main>
  )
}