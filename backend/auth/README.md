# Auth0 Integration Plan

This project will use **Auth0** for authentication, with Cloudflare Workers verifying JWTs and D1 storing user-related data.

## 1. User identity model

- `users.id` in D1 = Auth0 `sub` (subject) string.
  - Example: `auth0|abc123456`.
- All user-owned records in D1 reference this id via `user_id`.

## 2. Auth0 application setup (manual steps)

1. Create an **Auth0 tenant** if you don't have one.
2. Create a **SPA application** for the frontend.
   - Allowed Callback URLs: your Pages domain, e.g. `https://nameo.dev/` and `https://<project>.pages.dev/`.
   - Allowed Logout URLs: same as above.
3. Create an **API** in Auth0 for the Worker:
   - Identifier: e.g. `https://nameo-api` (must match `AUTH0_AUDIENCE`).
4. Note the following values:
   - `AUTH0_DOMAIN` (e.g. `your-tenant.us.auth0.com`)
   - `AUTH0_CLIENT_ID` (SPA app)
   - `AUTH0_AUDIENCE` (API identifier, e.g. `https://nameo-api`)

## 3. Configure Worker environment

In `wrangler.toml`, set:

```toml
[vars]
AUTH0_DOMAIN = "your-tenant.us.auth0.com"
AUTH0_AUDIENCE = "https://nameo-api"
```

These values will be available in the Worker as `env.AUTH0_DOMAIN` and `env.AUTH0_AUDIENCE`.

## 4. Worker-side JWT verification (implementation notes)

The `verifyAuth0Token` function in `backend/worker/index.js` should:

1. Read the `Authorization` header (`Bearer <token>`).
2. Decode the JWT header to get the `kid`.
3. Fetch the JWKS from `https://AUTH0_DOMAIN/.well-known/jwks.json`.
4. Find the matching key by `kid` and use it to verify the token signature.
5. Validate:
   - `iss` (issuer) matches `https://AUTH0_DOMAIN/`.
   - `aud` (audience) includes `AUTH0_AUDIENCE`.
6. Return `{ ok: true, sub }` where `sub` is the user id to use in D1.

You can implement this using a small verification library (e.g. `jose`) bundled into the Worker, or manually verifying the token using WebCrypto.

For now, `verifyAuth0Token` is stubbed to always allow requests so you can iterate on the UI and D1 without being blocked by Auth0 setup.

## 5. Frontend integration (high level)

- Use Auth0's SPA SDK in the frontend (added to `frontend/package.json`).
- Expose a simple login/logout button on the main site.
- On login, obtain an access token with `audience = AUTH0_AUDIENCE`.
- Attach `Authorization: Bearer <token>` to any requests that need to read or write D1-backed data (campaigns, options, saved searches).

Once this is wired, the Worker can:

- Look up or create `users` rows by `sub`.
- Store campaigns and options tied to that `user_id`.
