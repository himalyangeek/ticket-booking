import { createClient } from 'npm:@supabase/supabase-js@2'

// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically by the
// Edge Functions runtime — never set these manually, and never expose the service
// role key to the browser.
export function adminClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Verifies the caller's JWT (from the Authorization header) and returns their user id. */
export async function requireUser(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? ''
  const jwt = authHeader.replace('Bearer ', '')
  if (!jwt) return null

  const admin = adminClient()
  const { data, error } = await admin.auth.getUser(jwt)
  if (error || !data.user) return null
  return data.user
}
