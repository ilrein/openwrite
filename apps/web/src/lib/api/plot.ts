/**
 * Plot API client
 *
 * This module handles all plot thread/point related API operations.
 * Plot threads are narrative arcs and story structure elements.
 */

import { type ApiClient, apiCall } from "./base"

export interface PlotThread {
  id: string
  title: string
  description?: string
  type?: string // Type of plot point (inciting_incident, plot_point_1, etc.)
  order: number
  status?: string // planned, in_progress, completed
  chapterId?: string
  projectId?: string
  workId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreatePlotData {
  title: string
  description?: string
  type?: string
  order: number
  status?: string
  chapterId?: string
}

export interface UpdatePlotData extends Partial<CreatePlotData> {}

/**
 * Plot API client factory
 * Creates a plot API client for a specific project
 */
export const createPlotApi = (
  projectId: string
): Required<ApiClient<PlotThread, CreatePlotData, UpdatePlotData>> => ({
  async list(): Promise<PlotThread[]> {
    const response = await apiCall(`/api/projects/${projectId}/plot-points`)
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format from plot API")
    }
    return Array.isArray(response.plotPoints) ? response.plotPoints : []
  },

  async get(id: string): Promise<PlotThread> {
    const response = await apiCall(`/api/projects/${projectId}/plot-points/${id}`)
    if (!response?.plotPoint) {
      throw new Error(`Plot thread with id ${id} not found in response`)
    }
    return response.plotPoint
  },

  async create(data: CreatePlotData): Promise<PlotThread | { success: boolean; id: string }> {
    return await apiCall(`/api/projects/${projectId}/plot-points`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: UpdatePlotData): Promise<{ success: boolean }> {
    return await apiCall(`/api/projects/${projectId}/plot-points/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<{ success: boolean }> {
    return await apiCall(`/api/projects/${projectId}/plot-points/${id}`, {
      method: "DELETE",
    })
  },
})

/**
 * Global plot API (project-agnostic operations)
 */
export const plotApi = {
  // Create a plot API client for a specific project
  forProject: (projectId: string) => createPlotApi(projectId),

  // Convenience methods that require projectId
  list: (projectId: string) => createPlotApi(projectId).list(),
  get: (projectId: string, plotId: string) => createPlotApi(projectId).get(plotId),
  create: (projectId: string, data: CreatePlotData) => createPlotApi(projectId).create(data),
  update: (projectId: string, plotId: string, data: UpdatePlotData) =>
    createPlotApi(projectId).update(plotId, data),
  delete: (projectId: string, plotId: string) => createPlotApi(projectId).delete(plotId),
}
