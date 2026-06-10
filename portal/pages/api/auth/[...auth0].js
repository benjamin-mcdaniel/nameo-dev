// SPA mode: No server-side auth route. Keep placeholder to avoid 404s in dev.
export default function handler(req, res) {
  res.status(404).json({ error: 'Not available in SPA build' })
}
