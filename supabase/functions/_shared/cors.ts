// Restrict to your deployed frontend origin(s) in production, e.g.
// 'https://your-user.github.io'. A comma-separated ALLOWED_ORIGINS secret keeps this
// out of source so it can differ between environments.
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((o) => o.trim())

export function corsHeaders(origin: string | null): HeadersInit {
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}
