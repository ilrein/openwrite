import type { ApiClient } from "./base"
import { apiCall } from "./base"

/**
 * Novel data types
 */
export interface Novel {
  id: string
  title: string
  description: string | null
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

export interface CreateNovelData {
  title: string
  description?: string | null
  genre?: string | null
  targetWordCount?: number | null
  visibility?: "private" | "team" | "organization" | "public"
}

export interface UpdateNovelData {
  title?: string
  description?: string | null
  genre?: string | null
  targetWordCount?: number | null
  visibility?: "private" | "team" | "organization" | "public"
}

/**
 * Novel API client implementation
 */
export const novelApi: ApiClient<Novel, CreateNovelData, UpdateNovelData> = {
  async list(): Promise<Novel[]> {
    const response = await apiCall("/api/novels")
    return response.novels || []
  },

  async get(id: string): Promise<Novel> {
    const response = await apiCall(`/api/novels/${id}`)
    if (!response?.novel) {
      throw new Error(`Novel with id ${id} not found in response`)
    }
    return response.novel
  },

  async create(data: CreateNovelData): Promise<Novel | { success: boolean; id: string }> {
    return await apiCall("/api/novels", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async update(id: string, data: UpdateNovelData): Promise<{ success: boolean }> {
    return await apiCall(`/api/novels/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  async delete(id: string): Promise<{ success: boolean }> {
    return await apiCall(`/api/novels/${id}`, {
      method: "DELETE",
    })
  },
}
