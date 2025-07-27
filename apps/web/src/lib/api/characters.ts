/**
 * Character API client
 *
 * This module handles all character-related API operations
 * for the OpenWrite application.
 */

import { type ApiClient, apiCall } from "./base"

export interface Character {
  id: string
  name: string
  description?: string
  // role field removed - users can describe character roles freely in description
  // appearance, personality, backstory, motivation removed - simplified to just name and description
  projectId?: string
  workId?: string
  image?: string
  metadata?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateCharacterData {
  name: string
  description?: string
  // role field removed
  // appearance, personality, backstory, motivation removed - simplified to just name and description
  image?: string
  metadata?: string
}

export interface UpdateCharacterData extends Partial<CreateCharacterData> {}

/**
 * Character API client factory
 * Creates a character API client for a specific project
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
 * Global characters API (project-agnostic operations)
 */
export const charactersApi = {
  // Create a character API client for a specific project
  forProject: (projectId: string) => createCharacterApi(projectId),

  // Convenience methods that require projectId
  list: (projectId: string) => createCharacterApi(projectId).list(),
  get: (projectId: string, characterId: string) => createCharacterApi(projectId).get(characterId),
  create: (projectId: string, data: CreateCharacterData) =>
    createCharacterApi(projectId).create(data),
  update: (projectId: string, characterId: string, data: UpdateCharacterData) =>
    createCharacterApi(projectId).update(characterId, data),
  delete: (projectId: string, characterId: string) =>
    createCharacterApi(projectId).delete(characterId),
}
