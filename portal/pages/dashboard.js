import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

export default function Dashboard() {
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0()
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    try {
      const flag = typeof window !== 'undefined' && localStorage.getItem('nameo_guest') === 'true'
      setIsGuest(flag)
    } catch (_) {
      setIsGuest(false)
    }
  }, [])

  if (isLoading) return <main style={{ padding: 24 }}>Loading…</main>

  if (!isAuthenticated && !isGuest) {
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
      {isGuest ? (
        <p>Guest preview mode. No account access or data is available.</p>
      ) : (
        <p>Welcome, {user?.name || user?.email}.</p>
      )}
      <nav style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <a href="/">Home</a>
        {isGuest ? (
          <button onClick={() => { try { localStorage.removeItem('nameo_guest') } catch (_) {} ; window.location.href = '/' }}>Exit guest</button>
        ) : (
          <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Logout</button>
        )}
      </nav>
      <section>
        {isGuest ? (
          <p>Limited features are available in guest mode. Sign in to see your real data and manage resources.</p>
        ) : (
          <p>This page is protected and only visible to authenticated users.</p>
        )}
      </section>
    </main>
  )
}
