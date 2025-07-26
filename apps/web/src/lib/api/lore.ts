/**
 * Lore API client
 *
 * This module handles all lore/world-building related API operations.
 * Lore entries are generic knowledge base items for story world-building.
 */

import { type ApiClient, apiCall } from "./base"

export interface LoreEntry {
  id: string
  name: string
  description?: string
  type?: string // Generic type field for categorization
  projectId?: string
  workId?: string
  metadata?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateLoreData {
  name: string
  description?: string
  type?: string
  metadata?: string
}

export interface UpdateLoreData extends Partial<CreateLoreData> {}

/**
 * Lore API client factory
 * Creates a lore API client for a specific project
 */
export const createLoreApi = (
  projectId: string
): Required<ApiClient<LoreEntry, CreateLoreData, UpdateLoreData>> => ({
  async list(): Promise<LoreEntry[]> {
    const response = await apiCall(`/api/projects/${projectId}/lore`)
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format from lore API")
    }
    return Array.isArray(response.lore) ? response.lore : []
  },

  async get(id: string): Promise<LoreEntry> {
    const response = await apiCall(`/api/projects/${projectId}/lore/${id}`)
    if (!response?.lore) {
      throw new Error(`Lore entry with id ${id} not found in response`)
    }
    return response.lore
  },

  async create(data: CreateLoreData): Promise<LoreEntry | { success: boolean; id: string }> {
    return await apiCall(`/api/projects/${projectId}/lore`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: UpdateLoreData): Promise<{ success: boolean }> {
    return await apiCall(`/api/projects/${projectId}/lore/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<{ success: boolean }> {
    return await apiCall(`/api/projects/${projectId}/lore/${id}`, {
      method: "DELETE",
    })
  },
})

/**
 * Global lore API (project-agnostic operations)
 */
export const loreApi = {
  // Create a lore API client for a specific project
  forProject: (projectId: string) => createLoreApi(projectId),

  // Convenience methods that require projectId
  list: (projectId: string) => createLoreApi(projectId).list(),
  get: (projectId: string, loreId: string) => createLoreApi(projectId).get(loreId),
  create: (projectId: string, data: CreateLoreData) => createLoreApi(projectId).create(data),
  update: (projectId: string, loreId: string, data: UpdateLoreData) =>
    createLoreApi(projectId).update(loreId, data),
  delete: (projectId: string, loreId: string) => createLoreApi(projectId).delete(loreId),
}
