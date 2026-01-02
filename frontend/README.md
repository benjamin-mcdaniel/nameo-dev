# nameo.dev Frontend

Static site for the marketing pages of nameo.dev. Built with Vite + vanilla JS and deployed on Cloudflare Pages.

## Structure
```
frontend/
  index.html
  vite.config.js
  public/
    _headers
    _redirects
    favicon.ico (placeholder)
  src/
    main.js
    router.js
    components/{header.js, footer.js}
    pages/{home.js, help.js, login.js, pricing.js, privacy.js, terms.js, notfound.js}
    styles/{base.css, theme.css, layout.css}
```

## Dev
```
cd frontend
npm i
npm run dev
```
Open http://localhost:5173

## Build
```
npm run build
```
Output: `frontend/dist`

## Deploy (Cloudflare Pages)
- Set build command: `npm run build`
- Set build output directory: `frontend/dist`
- Set project root: `frontend/`
- `_redirects` already includes SPA fallback.

## Routing
Hash-based routes:
- `#/` home
- `#/help`
- `#/login`
- `#/pricing`
- `#/privacy`
- `#/terms`

## Notes
- Add your Cloudflare Web Analytics token in `index.html` if desired.
- Replace favicon and social images in `public/`.
