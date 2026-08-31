import { createClient } from 'npm:@supabase/supabase-js@2'

// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically by the
// Edge Functions runtime — never set these manually, and never expose the service
// role key to the browser.
export function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Reads the caller's user id from the Authorization JWT — without a network
 * round trip. Every function here is deployed with the platform's default
 * `verify_jwt: true`, so the gateway has already cryptographically verified
 * this token's signature before our code ever runs; a forged/expired token
 * never reaches this point. That makes a second, network-bound verification
 * call (the old `admin.auth.getUser(jwt)`) pure latency with no safety
 * benefit — this local decode is what actually keeps gate scans fast under a
 * queue.
 */
export function requireUser(req: Request): { id: string } | null {
  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace('Bearer ', '')
  if (!jwt) return null

  const parts = jwt.split('.')
  if (parts.length !== 3) return null

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(parts[1].length / 4) * 4, '=')
    const payload = JSON.parse(atob(base64))
    if (!payload.sub || typeof payload.sub !== 'string') return null
    return { id: payload.sub }
  } catch {
    return null
  }
}

/** Schedules background work (e.g. audit logging) to finish after the response is sent. */
export function runInBackground(promise: Promise<unknown>) {
  const runtime = (globalThis as { EdgeRuntime?: { waitUntil: (p: Promise<unknown>) => void } }).EdgeRuntime
  if (runtime) {
    runtime.waitUntil(promise)
  } else {
    promise.catch(() => {})
  }
}
