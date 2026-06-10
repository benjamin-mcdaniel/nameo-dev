import Link from 'next/link'
import { useAuth0 } from '@auth0/auth0-react'
import { useRouter } from 'next/router'

export default function Home() {
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0()
  const router = useRouter()

  const continueAsGuest = () => {
    try {
      localStorage.setItem('nameo_guest', 'true')
    } catch (_) {}
    router.push('/dashboard')
  }

  return (
    <main>
      <div className="container">
        <header className="nav">
          <div className="logo">
            <span className="logo-badge" /> nameo Portal
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link className="btn btn-ghost" href="/dashboard">Dashboard</Link>
            {!isAuthenticated && !isLoading ? (
              <button className="btn btn-primary" onClick={() => loginWithRedirect()}>Login</button>
            ) : (
              <button className="btn" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Logout</button>
            )}
          </div>
        </header>

        <section className="hero">
          <div>
            <h1 className="h1">Manage names with speed and confidence.</h1>
            <p className="lead">A lightweight portal for your nameo.dev experience. Sign in to access your dashboard, or continue as a guest to preview the interface without any account access.</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
              <button className="btn btn-primary" onClick={() => loginWithRedirect()}>Sign in with Auth0</button>
              <button className="btn" onClick={continueAsGuest}>Continue as guest</button>
            </div>
            {isAuthenticated && (
              <p style={{ marginTop: 10, color: 'var(--muted)' }}>Signed in as {user?.name || user?.email}</p>
            )}
          </div>
          <div className="card">
            <div className="kpis">
              <div className="kpi"><strong>0</strong><span>Active Names</span></div>
              <div className="kpi"><strong>—</strong><span>Usage</span></div>
              <div className="kpi"><strong>—</strong><span>Status</span></div>
            </div>
          </div>
        </section>

        <footer className="footer">
          © {new Date().getFullYear()} nameo.dev · <a href="https://nameo.dev/#/privacy" style={{ color: 'inherit' }}>Privacy</a> · <a href="https://nameo.dev/#/terms" style={{ color: 'inherit' }}>Terms</a>
        </footer>
      </div>
    </main>
  )
}
