import type { ApiClient } from "./base"
import { apiCall } from "./base"

/**
 * Project data types
 */
export interface Project {
  content?: string | null // Content field for writing interface
  coverImage: string | null
  createdAt: string
  currentWordCount: number
  description: string | null
  genre: string | null
  id: string
  lastWrittenAt: string | null
  status: "draft" | "in_progress" | "completed" | "published" | "archived"
  styleBible?: string | null // Story Bible "Style" section
  targetWordCount: number | null
  title: string
  type: "novel" | "trilogy" | "series" | "short_story_collection" | "graphic_novel" | "screenplay"
  updatedAt: string
  visibility: "private" | "organization" | "public"
}

export interface Work {
  coverImage: string | null
  createdAt: string
  currentWordCount: number
  description: string | null
  id: string
  lastWrittenAt: string | null
  metadata: string | null
  order: number
  projectId: string
  publishedAt: string | null
  status: "draft" | "in_progress" | "completed" | "published" | "archived"
  targetWordCount: number | null
  title: string
  updatedAt: string
  workType: "novel" | "short_story" | "novella" | "graphic_novel" | "screenplay"
}

// Legacy type for backward compatibility
export type Novel = Project

export interface CreateProjectData {
  description?: string | null
  genre?: string | null
  targetWordCount?: number | null
  title: string
  type?: "novel" | "trilogy" | "series" | "short_story_collection" | "graphic_novel" | "screenplay"
  visibility?: "private" | "organization" | "public"
}

// Legacy type for backward compatibility
export type CreateNovelData = CreateProjectData

export interface UpdateProjectData {
  description?: string | null
  genre?: string | null
  styleBible?: string | null
  targetWordCount?: number | null
  title?: string
  type?: "novel" | "trilogy" | "series" | "short_story_collection" | "graphic_novel" | "screenplay"
  visibility?: "private" | "organization" | "public"
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
