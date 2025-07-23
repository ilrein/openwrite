// Simple API client for testing the routing structure
const BASE_URL = import.meta.env.VITE_SERVER_URL || ""

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return response.json()
}

// Real API interface using database
export const rpc = {
  novel: {
    list: {
      query: () => apiCall("/api/novels"),
    },
    get: {
      query: ({ id }: { id: string }) => apiCall(`/api/novels/${id}`),
    },
    create: {
      mutate: (data: unknown) => {
        return apiCall("/api/novels", {
          method: "POST",
          body: JSON.stringify(data),
        })
      },
    },
  },
}
