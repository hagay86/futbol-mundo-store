// GET /api/geo → the visitor's country (from Vercel's edge), used to pick the site language.
export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.end(JSON.stringify({ country: String(req.headers['x-vercel-ip-country'] || '').toUpperCase() }));
}
