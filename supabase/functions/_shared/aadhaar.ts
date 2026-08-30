// Aadhaar numbers are sensitive government ID data — the full number is never stored.
// Only the last 4 digits (for display/verification at the gate) and a salted SHA-256
// hash (so the same Aadhaar can be recognized again without keeping the raw number)
// are persisted. AADHAAR_HASH_PEPPER is a server-side secret; without it the hash
// can't be brute-forced from the space of all 12-digit numbers.
const PEPPER = Deno.env.get('AADHAAR_HASH_PEPPER') ?? ''

export async function hashAadhaar(aadhaarNumber: string): Promise<{ last4: string; hash: string }> {
  const digits = aadhaarNumber.replace(/\s/g, '')
  const last4 = digits.slice(-4)
  const message = new TextEncoder().encode(`${PEPPER}:${digits}`)
  const digest = await crypto.subtle.digest('SHA-256', message)
  const hash = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return { last4, hash }
}
