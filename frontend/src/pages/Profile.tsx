import { useEffect, useState } from 'react'
import api from '../api'

interface UserProfile {
  user_id: number
  asgardeo_id: string
  first_name: string
  last_name: string
  role: string
  phone_number: string
  email: string
  date_of_birth: string
  overdue_count?: number
}

interface ProfileFormData {
  first_name: string
  last_name: string
  phone_number: string
  email: string
  date_of_birth: string
}

const emptyForm: ProfileFormData = {
  first_name: '',
  last_name: '',
  phone_number: '',
  email: '',
  date_of_birth: '',
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState<ProfileFormData>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const fetchProfile = async () => {
    try {
      setError('')

      const response = await api.get('/api/me')

      setProfile(response.data)

      setFormData({
        first_name: response.data.first_name ?? '',
        last_name: response.data.last_name ?? '',
        phone_number: response.data.phone_number ?? '',
        email: response.data.email ?? '',
        date_of_birth: response.data.date_of_birth ?? '',
      })
    } catch (err) {
      console.error(err)
      setError('Unable to load account details right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      setSaving(true)
      setError('')
      setSuccessMessage('')

      const response = await api.put('/api/me', formData)

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              ...response.data,
            }
          : response.data
      )

      setSuccessMessage('Account details updated successfully.')
    } catch (err) {
      console.error(err)
      setError('Unable to update account details right now.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="page-container">
        <h1>My Account</h1>
        <p>Loading account details...</p>
      </main>
    )
  }

  return (
    <main className="page-container">
      <h1>My Account</h1>

      <section className="book-form-section">
        <h2>Account Details</h2>

        {profile && (
          <div className="book-details profile-summary">
            <p>
              <span className="label">Role:</span> {profile.role}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="book-form">
          <div className="form-field">
            <label>First Name</label>
            <input
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label>Last Name</label>
            <input
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label>Phone Number</label>
            <input
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label>Email</label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label>Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {successMessage && <p className="success-message">{successMessage}</p>}
        {error && <p>{error}</p>}
      </section>
    </main>
  )
}