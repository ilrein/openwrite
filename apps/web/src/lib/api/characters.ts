import type { ApiClient } from "./base"
import { apiCall } from "./base"

/**
 * Character data types
 */
export interface Character {
  id: string
  name: string
  description: string | null
  role: "protagonist" | "antagonist" | "supporting" | "minor" | null
  appearance: string | null
  personality: string | null
  backstory: string | null
  motivation: string | null
  image: string | null
  metadata: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateCharacterData {
  name: string
  description?: string | null
  role?: "protagonist" | "antagonist" | "supporting" | "minor" | null
  appearance?: string | null
  personality?: string | null
  backstory?: string | null
  motivation?: string | null
  image?: string | null
  metadata?: string | null
}

export interface UpdateCharacterData {
  name?: string
  description?: string | null
  role?: "protagonist" | "antagonist" | "supporting" | "minor" | null
  appearance?: string | null
  personality?: string | null
  backstory?: string | null
  motivation?: string | null
  image?: string | null
  metadata?: string | null
}

/**
 * Character API client implementation with project context
 */
export const createCharacterApi = (
  projectId: string
): Required<ApiClient<Character, CreateCharacterData, UpdateCharacterData>> => ({
  async list(): Promise<Character[]> {
    const response = await apiCall(`/api/projects/${projectId}/characters`)
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format from characters API")
    }
    return Array.isArray(response.characters) ? response.characters : []
  },

  async get(id: string): Promise<Character> {
    const response = await apiCall(`/api/projects/${projectId}/characters/${id}`)
    if (!response?.character) {
      throw new Error(`Character with id ${id} not found in response`)
    }
    return response.character
  },

  async create(data: CreateCharacterData): Promise<Character | { success: boolean; id: string }> {
    return await apiCall(`/api/projects/${projectId}/characters`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: UpdateCharacterData): Promise<{ success: boolean }> {
    return await apiCall(`/api/projects/${projectId}/characters/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<{ success: boolean }> {
    return await apiCall(`/api/projects/${projectId}/characters/${id}`, {
      method: "DELETE",
    })
  },
})

/**
 * Simple character API for direct usage (requires projectId parameter)
 */
export const charactersApi = {
  list: (projectId: string) => createCharacterApi(projectId).list(),
  get: (projectId: string, characterId: string) => createCharacterApi(projectId).get(characterId),
  create: (projectId: string, data: CreateCharacterData) =>
    createCharacterApi(projectId).create(data),
  update: (projectId: string, characterId: string, data: UpdateCharacterData) =>
    createCharacterApi(projectId).update(characterId, data),
  delete: (projectId: string, characterId: string) =>
    createCharacterApi(projectId).delete(characterId),
}
