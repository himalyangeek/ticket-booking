import * as ed25519 from 'npm:@noble/ed25519@2'

// signAsync/verifyAsync use the runtime's Web Crypto (globalThis.crypto.subtle) for
// SHA-512 automatically — Deno's Edge Function runtime provides it, no extra wiring needed.

export interface QrClaims {
  v: 1
  kid: string
  tid: string
  pid: string
  ts: string
  exp: string
  p: number
  nonce: string
}

/** Deterministic canonical string built from the unsigned claims — sign and verify must reconstruct this exact string. */
export function canonicalize(claims: QrClaims): string {
  return [
    `v=${claims.v}`,
    `kid=${claims.kid}`,
    `tid=${claims.tid}`,
    `pid=${claims.pid}`,
    `ts=${claims.ts}`,
    `exp=${claims.exp}`,
    `p=${claims.p}`,
    `nonce=${claims.nonce}`,
  ].join('&')
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

export async function signClaims(claims: QrClaims, privateKeyB64: string): Promise<string> {
  const message = new TextEncoder().encode(canonicalize(claims))
  const privateKey = base64UrlDecode(privateKeyB64)
  const signature = await ed25519.signAsync(message, privateKey)
  return base64UrlEncode(signature)
}

export async function verifySignature(claims: QrClaims, sig: string, publicKeyB64: string): Promise<boolean> {
  try {
    const message = new TextEncoder().encode(canonicalize(claims))
    const publicKey = base64UrlDecode(publicKeyB64)
    const signature = base64UrlDecode(sig)
    return await ed25519.verifyAsync(signature, message, publicKey)
  } catch {
    return false
  }
}

export function randomNonce(): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)))
}
