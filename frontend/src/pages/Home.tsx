import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsgardeo } from '@asgardeo/react'
import api, { setAccessToken } from '../api'

export default function Home() {
  const auth = useAsgardeo()
  const navigate = useNavigate()

  const [message, setMessage] = useState('')
  const [loadingUser, setLoadingUser] = useState(false)

  useEffect(() => {
    const checkCurrentUser = async () => {
      if (auth?.isLoading || !auth?.isSignedIn) {
        return
      }

      try {
        setLoadingUser(true)

        const token = await auth.getAccessToken()
        setAccessToken(token)

        const response = await api.get('/api/me')
        const user = response.data

        if (
          user.first_name === 'Pending' ||
          user.phone_number === 'Pending'
        ) {
          navigate('/complete-profile')
        }
      } catch (err) {
        console.error('Error checking current user:', err)
      } finally {
        setLoadingUser(false)
      }
    }

    checkCurrentUser()
  }, [auth?.isLoading, auth?.isSignedIn, navigate])

  const testBackendAuth = async () => {
    try {
      const token = await auth.getAccessToken()
      setAccessToken(token)

      const response = await api.get('/api/auth-test')

      console.log('AUTH TEST RESPONSE:', response.data)

      setMessage(
        `Backend auth worked. Asgardeo ID: ${response.data.asgardeoId}`
      )
    } catch (err) {
      console.error(err)
      setMessage('Backend auth test failed.')
    }
  }

  return (
    <main className="page-container">
      <h1>Library Project</h1>
      <p>Welcome to the library catalog.</p>

      {loadingUser && <p>Loading your account...</p>}

      {auth?.isSignedIn && (
        <button onClick={testBackendAuth}>
          Test Backend Auth
        </button>
      )}

      {message && <p>{message}</p>}
    </main>
  )
}