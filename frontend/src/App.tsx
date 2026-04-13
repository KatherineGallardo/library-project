import './App.css'

function App() {
  return (
    <main className="splash-page">
      <section className="hero-section">
        <div className="hero-text">
          <h1>Library App</h1>

          <p className="coming-soon">Coming Soon</p>

          <p className="description">
            A library management system that allows users to browse books, check them out, return them, and track which books are currently on loan.
          </p>

          <div className="button-group">
            <a
              href="https://github.com/KatherineGallardo/library-project"
              target="_blank"
              rel="noreferrer"
              className="primary-btn"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App