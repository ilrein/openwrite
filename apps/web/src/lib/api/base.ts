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
    throw new Error(`API Error: ${response.status} - ${response.statusText}`)
  }

  return response.json()
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
