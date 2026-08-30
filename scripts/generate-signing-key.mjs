// One-time dev tool: generates an Ed25519 keypair for QR signing using Node's
// built-in, established crypto primitives (no custom cryptography).
// Usage: node scripts/generate-signing-key.mjs [key-id]
import { generateKeyPairSync } from 'node:crypto'

const keyId = process.argv[2] ?? `key-${new Date().toISOString().slice(0, 7)}`

const { privateKey, publicKey } = generateKeyPairSync('ed25519')

// JWK export gives the raw 32-byte seed/public key, base64url-encoded —
// exactly the format supabase/functions/_shared/qr.ts expects.
const privateJwk = privateKey.export({ format: 'jwk' })
const publicJwk = publicKey.export({ format: 'jwk' })

console.log('Key id:', keyId)
console.log()
console.log('Set these as Supabase Edge Function secrets:')
console.log()
console.log(`SIGNING_KEY_ID=${keyId}`)
console.log(`ED25519_PRIVATE_KEY=${privateJwk.d}`)
console.log(`ED25519_PUBLIC_KEYS={"${keyId}":"${publicJwk.x}"}`)
console.log()
console.log('Never commit ED25519_PRIVATE_KEY or paste it anywhere but `supabase secrets set`.')
