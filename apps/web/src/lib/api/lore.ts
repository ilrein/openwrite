/**
 * Lore API client
 *
 * This module handles all lore/world-building related API operations.
 * Lore entries are generic knowledge base items for story world-building.
 */

import { type ApiClient, apiCall } from "./base"

export interface LoreEntry {
  createdAt: Date
  description?: string
  id: string
  metadata?: string
  name: string
  projectId?: string
  type?: string // Generic type field for categorization
  updatedAt: Date
  workId?: string
}

export interface CreateLoreData {
  description?: string
  metadata?: string
  name: string
  type?: string
}

export const LORE_TYPE_OPTIONS: { label: string; value: string }[] = [
  { value: "core_rule", label: "Core Rule" },
  { value: "history", label: "History" },
  { value: "culture", label: "Culture" },
  { value: "magic_system", label: "Magic System" },
  { value: "technology", label: "Technology" },
  { value: "religion", label: "Religion" },
  { value: "politics", label: "Politics" },
  { value: "custom", label: "Custom" },
]

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
