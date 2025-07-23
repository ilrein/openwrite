/**
 * Base API client utility for making authenticated requests
 */

const BASE_URL = import.meta.env.VITE_SERVER_URL || ""

export interface ApiRequestOptions extends RequestInit {
  headers?: Record<string, string>
}

/**
 * Base API call function with authentication
 */
export async function apiCall(endpoint: string, options: ApiRequestOptions = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Include auth cookies
    ...options,
  })

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} - ${response.statusText}`
    try {
      const errorBody = await response.json()
      if (errorBody.message) {
        errorMessage += ` - ${errorBody.message}`
      }
    } catch {
      // Ignore JSON parse errors for error responses
    }
    throw new Error(errorMessage)
  }

  try {
    return await response.json()
  } catch (error) {
    throw new Error(`Invalid JSON response from ${endpoint}: ${error}`)
  }
}

/**
 * Generic API client interface for CRUD operations
 */
export interface ApiClient<T, CreateData = Partial<T>, UpdateData = Partial<T>> {
  list: () => Promise<T[]>
  get: (id: string) => Promise<T>
  create: (data: CreateData) => Promise<T | { success: boolean; id: string }>
  update?: (id: string, data: UpdateData) => Promise<T | { success: boolean }>
  delete?: (id: string) => Promise<{ success: boolean }>
}
