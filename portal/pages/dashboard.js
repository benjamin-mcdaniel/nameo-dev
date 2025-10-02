import { withPageAuthRequired, getSession } from '@auth0/nextjs-auth0'

function Dashboard({ user }) {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.name || user?.email}.</p>
      <nav style={{ display: 'flex', gap: 12, margin: '16px 0' }}>
        <a href="/">Home</a>
        <a href="/api/auth/logout">Logout</a>
      </nav>
      <section>
        <p>This page is protected and only visible to authenticated users.</p>
      </section>
    </main>
  )
}

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(ctx) {
    const { user } = await getSession(ctx.req, ctx.res)
    return { props: { user } }
  },
})

export default Dashboard
