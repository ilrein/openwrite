/**
 * Encryption utilities for sensitive data like API keys
 * Uses Web Crypto API available in Cloudflare Workers
 */

// Use AES-GCM for authenticated encryption
const ALGORITHM = "AES-GCM"
const IV_LENGTH = 12 // 96 bits for AES-GCM

/**
 * Get or create the encryption key from environment
 */
async function getEncryptionKey(env: { ENCRYPTION_KEY?: string }): Promise<CryptoKey> {
  const keyString = env.ENCRYPTION_KEY

  if (!keyString) {
    throw new Error("ENCRYPTION_KEY environment variable is required for API key encryption")
  }

  // Convert base64 key to ArrayBuffer
  const keyBuffer = Uint8Array.from(atob(keyString), (c) => c.charCodeAt(0))

  return await crypto.subtle.importKey("raw", keyBuffer, { name: ALGORITHM }, false, [
    "encrypt",
    "decrypt",
  ])
}

/**
 * Encrypt a plain text string (like an API key)
 */
export async function encryptApiKey(
  plaintext: string,
  env: { ENCRYPTION_KEY?: string }
): Promise<string> {
  try {
    const key = await getEncryptionKey(env)
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
      },
      key,
      data
    )

    // Combine IV + encrypted data and encode as base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)

    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    throw new Error(
      `Failed to encrypt API key: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

/**
 * Decrypt an encrypted API key back to plain text
 */
export async function decryptApiKey(
  encryptedData: string,
  env: { ENCRYPTION_KEY?: string }
): Promise<string> {
  try {
    const key = await getEncryptionKey(env)

    // Decode base64 and extract IV + encrypted data
    const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0))
    const iv = combined.slice(0, IV_LENGTH)
    const encrypted = combined.slice(IV_LENGTH)

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
      },
      key,
      encrypted
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (error) {
    throw new Error(
      `Failed to decrypt API key: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

/**
 * Generate a new encryption key (for setup/deployment)
 * This should be run once and the result stored as ENCRYPTION_KEY env var
 */
export async function generateEncryptionKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    {
      name: ALGORITHM,
      length: 256, // 256-bit key
    },
    true,
    ["encrypt", "decrypt"]
  )

  const keyBuffer = await crypto.subtle.exportKey("raw", key)
  return btoa(String.fromCharCode(...new Uint8Array(keyBuffer)))
}

/**
 * Hash an API key for identification purposes (non-reversible)
 * Used for keyHash field to identify keys without storing them in plain text
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(apiKey)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = new Uint8Array(hashBuffer)
  return btoa(String.fromCharCode(...hashArray)).substring(0, 16) // First 16 chars for identification
}
