// Auth0 configuration for the frontend.
// Replace the placeholder values once your Auth0 SPA app is created.

export const authConfig = {
  domain: 'dev-17f30x2uvmivb8or.us.auth0.com', // update if tenant changes
  clientId: 'JUnYcjxL8rqX7lMKscJZYmFCxteo8UON',            // TODO: set real SPA client ID
  audience: 'https://nameo-api',               // must match AUTH0_AUDIENCE in wrangler.toml
  redirectUri: window.location.origin + '/'
}

export function isAuthConfigured() {
  return (
    !!authConfig.domain &&
    !!authConfig.clientId
  )
}
