/**
 * Chapters API client
 *
 * Manages a project's chapters and their content.
 */

import { apiCall } from "./base"

export interface Chapter {
  braindump: string | null
  id: string
  order: number
  status: string
  summary: string | null
  title: string
  updatedAt: string
  wordCount: number
  workId: string
}

export interface ChapterContent {
  chapterId: string
  content: string
  updatedAt: string
  wordCount: number
}

export interface SaveChapterContentResult {
  chapterId: string
  projectWordCount: number
  savedAt: string
  success: boolean
  wordCount: number
}

export const chaptersApi = {
  async list(projectId: string): Promise<Chapter[]> {
    const response = await apiCall(`/api/projects/${projectId}/chapters`)
    return Array.isArray(response.chapters) ? response.chapters : []
  },

  async create(projectId: string, title?: string): Promise<{ success: boolean; id: string }> {
    return (await apiCall(`/api/projects/${projectId}/chapters`, {
      method: "POST",
      body: JSON.stringify(title ? { title } : {}),
    })) as { success: boolean; id: string }
  },

  async update(
    projectId: string,
    chapterId: string,
    data: { title?: string; summary?: string; braindump?: string; status?: string }
  ): Promise<{ success: boolean }> {
    return (await apiCall(`/api/projects/${projectId}/chapters/${chapterId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })) as { success: boolean }
  },

  async reorder(projectId: string, chapterIds: string[]): Promise<{ success: boolean }> {
    return (await apiCall(`/api/projects/${projectId}/chapters/reorder`, {
      method: "POST",
      body: JSON.stringify({ chapterIds }),
    })) as { success: boolean }
  },

  async delete(projectId: string, chapterId: string): Promise<{ success: boolean }> {
    return (await apiCall(`/api/projects/${projectId}/chapters/${chapterId}`, {
      method: "DELETE",
    })) as { success: boolean }
  },

  async getContent(projectId: string, chapterId: string): Promise<ChapterContent> {
    return (await apiCall(
      `/api/projects/${projectId}/chapters/${chapterId}/content`
    )) as ChapterContent
  },

  async saveContent(
    projectId: string,
    chapterId: string,
    content: string,
    baseUpdatedAt?: string
  ): Promise<SaveChapterContentResult> {
    return (await apiCall(`/api/projects/${projectId}/chapters/${chapterId}/content`, {
      method: "PUT",
      body: JSON.stringify({ content, baseUpdatedAt }),
    })) as SaveChapterContentResult
  },
}
