import { Auth0Provider } from '@auth0/auth0-react'

export default function App({ Component, pageProps }) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : undefined,
      }}
      cacheLocation="memory"
      useRefreshTokens={false}
    >
      <Component {...pageProps} />
    </Auth0Provider>
  )
}
