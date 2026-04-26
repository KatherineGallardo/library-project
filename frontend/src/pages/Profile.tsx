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
  date_of_birth: string
}

const emptyForm: ProfileFormData = {
  first_name: '',
  last_name: '',
  phone_number: '',
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
      const data = response.data

      setProfile(data)

      setFormData({
        first_name: data.first_name ?? '',
        last_name: data.last_name ?? '',
        phone_number: data.phone_number ?? '',
        date_of_birth: data.date_of_birth ?? '',
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

      // 🔒 Validation (same style as CompleteProfile)
      const phonePattern = /^\d{3}-\d{3}-\d{4}$/

      if (!phonePattern.test(formData.phone_number)) {
        setError('Phone number must be in this format: 123-456-7890')
        return
      }

      const today = new Date()
      const birthDate = new Date(formData.date_of_birth)

      if (!formData.date_of_birth || Number.isNaN(birthDate.getTime())) {
        setError('Please enter a valid date of birth.')
        return
      }

      if (birthDate >= today) {
        setError('Date of birth must be in the past.')
        return
      }

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
    } catch (err: any) {
      console.error(err)

      const backendMessage =
        err?.response?.data?.error || 'Unable to update account details.'

      setError(backendMessage)
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
              placeholder="123-456-7890"
              value={formData.phone_number}
              onChange={handleChange}
              required
            />
          </div>

          {/* 🔒 Read-only email */}
          <div className="form-field">
            <label>Email</label>
            <input value={profile?.email ?? ''} readOnly />
            <small className="helper-text">
              Email cannot be changed after account creation.
            </small>
          </div>

          <div className="form-field">
            <label>Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              max={new Date().toISOString().split('T')[0]}
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
        {error && <p className="error-message">{error}</p>}
      </section>
    </main>
  )
}