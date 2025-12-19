import { createAuth0Client } from '@auth0/auth0-spa-js'
import { authConfig, isAuthConfigured } from './config.js'

let auth0Promise = null

async function getClient() {
  if (!isAuthConfigured()) return null
  if (!auth0Promise) {
    auth0Promise = createAuth0Client({
      domain: authConfig.domain,
      clientId: authConfig.clientId,
      authorizationParams: {
        audience: authConfig.audience,
        redirect_uri: authConfig.redirectUri,
      },
      cacheLocation: 'localstorage',
      useRefreshTokens: true,
    })
  }
  return auth0Promise
}

export async function loginWithRedirect() {
  const client = await getClient()
  if (!client) throw new Error('Auth0 is not configured')
  await client.loginWithRedirect()
}

export async function logout() {
  const client = await getClient()
  if (!client) throw new Error('Auth0 is not configured')
  await client.logout({ returnTo: window.location.origin })
}

export async function getAccessToken() {
  const client = await getClient()
  if (!client) return null
  try {
    const token = await client.getTokenSilently({
      authorizationParams: { audience: authConfig.audience },
    })
    return token
  } catch (err) {
    return null
  }
}

export async function isAuthenticated() {
  const client = await getClient()
  if (!client) return false
  try {
    return await client.isAuthenticated()
  } catch (err) {
    return false
  }
}

export async function getUser() {
  const client = await getClient()
  if (!client) return null
  try {
    return await client.getUser()
  } catch (err) {
    return null
  }
}

export async function handleAuthRedirectCallbackIfNeeded() {
  const client = await getClient()
  if (!client) return

  const url = new URL(window.location.href)
  const hasCode = url.searchParams.get('code')
  const hasState = url.searchParams.get('state')

  if (!hasCode || !hasState) return

  try {
    await client.handleRedirectCallback()
  } catch (err) {
    // swallow errors; user can always try logging in again
  } finally {
    // Clean up the query params while preserving hash routing
    url.searchParams.delete('code')
    url.searchParams.delete('state')
    window.history.replaceState({}, document.title, url.toString())
  }
}
