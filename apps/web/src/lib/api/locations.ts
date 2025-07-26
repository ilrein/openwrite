/**
 * Location API client
 *
 * This module handles all location-related API operations
 * following the same patterns as the characters API.
 */

import { type ApiClient, apiCall } from "./base"

export interface Location {
  id: string
  name: string
  description?: string
  type?: "city" | "country" | "building" | "room" | "fantasy_realm" | "planet" | "dimension"
  projectId?: string
  workId?: string
  parentLocationId?: string | null
  image?: string
  metadata?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateLocationData {
  name: string
  description?: string
  type?: Location["type"]
  parentLocationId?: string | null
  image?: string
  metadata?: string
}

export interface UpdateLocationData extends Partial<CreateLocationData> {}

/**
 * Location API client factory
 * Creates a location API client for a specific project
 */
export const createLocationApi = (
  projectId: string
): Required<ApiClient<Location, CreateLocationData, UpdateLocationData>> => ({
  async list(): Promise<Location[]> {
    const response = await apiCall(`/api/projects/${projectId}/locations`)
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format from locations API")
    }
    return Array.isArray(response.locations) ? response.locations : []
  },

  async get(id: string): Promise<Location> {
    const response = await apiCall(`/api/projects/${projectId}/locations/${id}`)
    if (!response?.location) {
      throw new Error(`Location with id ${id} not found in response`)
    }
    return response.location
  },

  async create(data: CreateLocationData): Promise<Location | { success: boolean; id: string }> {
    return await apiCall(`/api/projects/${projectId}/locations`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: UpdateLocationData): Promise<{ success: boolean }> {
    return await apiCall(`/api/projects/${projectId}/locations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<{ success: boolean }> {
    return await apiCall(`/api/projects/${projectId}/locations/${id}`, {
      method: "DELETE",
    })
  },
})

/**
 * Global locations API (project-agnostic operations)
 */
export const locationsApi = {
  // Create a location API client for a specific project
  forProject: (projectId: string) => createLocationApi(projectId),

  // Convenience methods that require projectId
  list: (projectId: string) => createLocationApi(projectId).list(),
  get: (projectId: string, locationId: string) => createLocationApi(projectId).get(locationId),
  create: (projectId: string, data: CreateLocationData) =>
    createLocationApi(projectId).create(data),
  update: (projectId: string, locationId: string, data: UpdateLocationData) =>
    createLocationApi(projectId).update(locationId, data),
  delete: (projectId: string, locationId: string) =>
    createLocationApi(projectId).delete(locationId),
}
