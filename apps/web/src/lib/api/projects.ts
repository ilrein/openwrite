import type { ApiClient } from "./base"
import { apiCall } from "./base"

/**
 * Project data types
 */
export interface Project {
  id: string
  title: string
  description: string | null
  type: "novel" | "trilogy" | "series" | "short_story_collection" | "graphic_novel" | "screenplay"
  genre: string | null
  status: "draft" | "in_progress" | "completed" | "published" | "archived"
  visibility: "private" | "team" | "organization" | "public"
  currentWordCount: number
  targetWordCount: number | null
  coverImage: string | null
  content?: string | null // Content field for writing interface
  createdAt: string
  updatedAt: string
  lastWrittenAt: string | null
}

export interface Work {
  id: string
  projectId: string
  title: string
  description: string | null
  workType: "novel" | "short_story" | "novella" | "graphic_novel" | "screenplay"
  order: number
  targetWordCount: number | null
  currentWordCount: number
  status: "draft" | "in_progress" | "completed" | "published" | "archived"
  coverImage: string | null
  metadata: string | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  lastWrittenAt: string | null
}

// Legacy type for backward compatibility
export type Novel = Project

export interface CreateProjectData {
  title: string
  description?: string | null
  type?: "novel" | "trilogy" | "series" | "short_story_collection" | "graphic_novel" | "screenplay"
  genre?: string | null
  targetWordCount?: number | null
  visibility?: "private" | "team" | "organization" | "public"
}

// Legacy type for backward compatibility
export type CreateNovelData = CreateProjectData

export interface UpdateProjectData {
  title?: string
  description?: string | null
  type?: "novel" | "trilogy" | "series" | "short_story_collection" | "graphic_novel" | "screenplay"
  genre?: string | null
  targetWordCount?: number | null
  visibility?: "private" | "team" | "organization" | "public"
}

// Legacy type for backward compatibility
export type UpdateNovelData = UpdateProjectData

/**
 * Project API client implementation
 */
export const projectApi: ApiClient<Project, CreateProjectData, UpdateProjectData> = {
  async list(): Promise<Project[]> {
    const response = await apiCall("/api/projects")
    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format from projects API")
    }
    return Array.isArray(response.projects) ? response.projects : []
  },

  async get(id: string): Promise<Project> {
    const response = await apiCall(`/api/projects/${id}`)
    if (!response?.project) {
      throw new Error(`Project with id ${id} not found in response`)
    }
    return response.project
  },

  async create(data: CreateProjectData): Promise<Project | { success: boolean; id: string }> {
    return await apiCall("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: UpdateProjectData): Promise<{ success: boolean }> {
    return await apiCall(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<{ success: boolean }> {
    return await apiCall(`/api/projects/${id}`, {
      method: "DELETE",
    })
  },
}

// Legacy export for backward compatibility
export const novelApi = projectApi
