import { createAuthClient } from "better-auth/react"

// Session data types
export interface SessionUser {
  id: string
  email: string
  name: string | null
}

export interface SessionData {
  authenticated: boolean
  session?: {
    user: SessionUser
  } | null
  error?: string
}

// Singleton pattern for Better Auth client
let authClientInstance: ReturnType<typeof createAuthClient> | null = null

function getAuthClient() {
  if (!authClientInstance) {
    authClientInstance = createAuthClient({
      baseURL:
        import.meta.env.DEV && import.meta.env.VITE_SERVER_URL
          ? import.meta.env.VITE_SERVER_URL
          : window.location.origin,
      basePath: "/api/auth",
    })
  }
  return authClientInstance
}

export const authClient = getAuthClient()

// Singleton session fetcher to prevent multiple simultaneous calls
let sessionPromise: Promise<SessionData> | null = null

export function fetchSessionData(): Promise<SessionData> {
  if (sessionPromise) {
    return sessionPromise
  }

  const baseUrl =
    import.meta.env.DEV && import.meta.env.VITE_SERVER_URL
      ? import.meta.env.VITE_SERVER_URL
      : window.location.origin

  sessionPromise = fetch(`${baseUrl}/api/session`, {
    credentials: "include",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch session")
      }
      return response.json()
    })
    .finally(() => {
      // Reset the promise after completion so future calls can be made
      sessionPromise = null
    })

  return sessionPromise
}
