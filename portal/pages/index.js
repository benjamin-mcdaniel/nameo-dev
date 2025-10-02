import Link from 'next/link'
import { useUser } from '@auth0/nextjs-auth0/client'

export default function Home() {
  const { user, isLoading } = useUser()

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>nameo Portal</h1>
      <p>Welcome to the portal.</p>
      <nav style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        {!user && !isLoading && (
          <a href="/api/auth/login">Login</a>
        )}
        {user && (
          <>
            <span>Signed in as {user.name || user.email}</span>
            <a href="/api/auth/logout">Logout</a>
          </>
        )}
      </nav>
      <section>
        <p>Use the navigation above to explore.</p>
      </section>
    </main>
  )
}
