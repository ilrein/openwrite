/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth flows
 */

function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64URLEncode(array.buffer)
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)
  const digest = await crypto.subtle.digest("SHA-256", data)
  return base64URLEncode(digest)
}

export interface PKCEParams {
  codeVerifier: string
  codeChallenge: string
  codeChallengeMethod: "S256"
}

export async function generatePKCEParams(): Promise<PKCEParams> {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: "S256",
  }
}

export function buildAuthURL(params: {
  callbackUrl: string
  codeChallenge: string
  codeChallengeMethod: string
}): string {
  const baseURL = "https://openrouter.ai/auth"
  const urlParams = new URLSearchParams({
    callback_url: params.callbackUrl,
    code_challenge: params.codeChallenge,
    code_challenge_method: params.codeChallengeMethod,
  })

  return `${baseURL}?${urlParams.toString()}`
}
