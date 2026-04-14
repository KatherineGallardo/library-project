export default function Login() {
  return (
    <main className="page-container">
      <h1>Sign In</h1>
      <p>This app currently supports username/password auth through the backend API.</p>
      <form className="auth-form">
        <label>
          Username
          <input type="text" name="username" />
        </label>
        <label>
          Password
          <input type="password" name="password" />
        </label>
        <button type="submit" className="primary-btn">
          Log In
        </button>
      </form>
    </main>
  )
}
