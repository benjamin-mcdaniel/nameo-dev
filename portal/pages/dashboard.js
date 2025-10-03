import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

export default function Dashboard() {
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Optionally auto-redirect to login
      // loginWithRedirect()
    }
  }, [isLoading, isAuthenticated, loginWithRedirect])

  if (isLoading) return <main style={{ padding: 24 }}>Loading…</main>

  if (!isAuthenticated) {
    return (
      <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <h1>Dashboard</h1>
        <p>You must be logged in to view this page.</p>
        <button onClick={() => loginWithRedirect()}>Login</button>
      </main>
    )
  }

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name || user?.email}.</p>
      <nav style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <a href="/">Home</a>
        <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Logout</button>
      </nav>
      <section>
        <p>This page is protected and only visible to authenticated users.</p>
      </section>
    </main>
  )
}
