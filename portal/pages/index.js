import Link from 'next/link'
import { useAuth0 } from '@auth0/auth0-react'

export default function Home() {
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0()

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>nameo Portal</h1>
      <p>Welcome to the portal.</p>
      <nav style={{ display: 'flex', gap: 12, margin: '16px 0', alignItems: 'center' }}>
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        {!isAuthenticated && !isLoading && (
          <button onClick={() => loginWithRedirect()}>Login</button>
        )}
        {isAuthenticated && (
          <>
            <span>Signed in as {user?.name || user?.email}</span>
            <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Logout</button>
          </>
        )}
      </nav>
      <section>
        <p>Use the navigation above to explore.</p>
      </section>
    </main>
  )
}
