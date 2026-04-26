import { useEffect } from 'react'
import { useAsgardeo } from '@asgardeo/react'

export default function Login() {
  const auth = useAsgardeo()

  useEffect(() => {
    if (!auth?.isLoading && !auth?.isSignedIn) {
      auth?.signIn()
    }
  }, [auth?.isLoading, auth?.isSignedIn])

  return (
    <main className="page-container">
      <h1>Redirecting to Sign In...</h1>
      <p>If you are not redirected automatically, please wait or refresh.</p>
    </main>
  )
}