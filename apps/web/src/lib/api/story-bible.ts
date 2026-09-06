/**
 * Story Bible API client — worldbuilding elements, character groups, the
 * project style guide, and the AI generation endpoints that back them.
 *
 * Every generation endpoint returns `options: string[]` so the UI can show the
 * Sudowrite-style pick list; braindump returns freeform `text`.
 */

import { apiCall } from "./base"

export interface Trait {
  id: string
  label: string
  value: string
}

export type CharacterRole = "protagonist" | "antagonist" | "supporting" | "minor" | "love_interest"

export const CHARACTER_ROLE_OPTIONS: { label: string; value: CharacterRole }[] = [
  { value: "protagonist", label: "Protagonist" },
  { value: "antagonist", label: "Antagonist" },
  { value: "supporting", label: "Supporting Character" },
  { value: "minor", label: "Minor Character" },
  { value: "love_interest", label: "Love Interest" },
]

export const CHARACTER_DEFAULT_TRAIT_LABELS = [
  "Personality",
  "Background",
  "Physical Description",
  "Dialogue Style",
  "Skills & Resources",
  "Relationship to Protagonist",
  "Role in Story",
  "Other Names",
] as const

export type WorldElementType =
  | "setting"
  | "item"
  | "organization"
  | "culture"
  | "magic_system"
  | "technology"
  | "religion"
  | "history"
  | "language"
  | "creature"
  | "other"

export const WORLD_ELEMENT_TYPE_OPTIONS: { label: string; value: WorldElementType }[] = [
  { value: "setting", label: "Setting" },
  { value: "item", label: "Item" },
  { value: "organization", label: "Organization" },
  { value: "culture", label: "Culture" },
  { value: "magic_system", label: "Magic System" },
  { value: "technology", label: "Technology" },
  { value: "religion", label: "Religion" },
  { value: "history", label: "History" },
  { value: "language", label: "Language" },
  { value: "creature", label: "Creature" },
  { value: "other", label: "Other" },
]

export const WORLD_ELEMENT_DEFAULT_TRAIT_LABELS: Record<WorldElementType, readonly string[]> = {
  setting: ["Geography", "History", "Atmosphere", "Notable Features", "Other Names"],
  item: ["Appearance", "History", "Powers & Properties", "Who owns it", "Other Names"],
  organization: ["Goals", "History", "Headquarters", "Notable Members", "Other Names"],
  culture: ["Values & Beliefs", "Customs & Traditions", "History", "Language", "Other Names"],
  magic_system: ["Rules & Limits", "Source", "Cost", "Who can use it", "History"],
  technology: ["How it works", "Limitations", "Who controls it", "History", "Other Names"],
  religion: ["Beliefs", "Practices & Rituals", "Hierarchy", "History", "Other Names"],
  history: ["Timeline", "Key Figures", "Causes", "Consequences", "Other Names"],
  language: ["Speakers", "Sample Phrases", "Writing System", "History"],
  creature: ["Physical Description", "Behavior", "Habitat", "Abilities", "Other Names"],
  other: ["Details", "History", "Notes", "Other Names"],
}

let idCounter = 0
export const newTrait = (label = "", value = ""): Trait => {
  idCounter += 1
  return { id: `trait-${Date.now()}-${idCounter}`, label, value }
}

export const traitsFromLabels = (labels: readonly string[]): Trait[] =>
  labels.map((label) => newTrait(label))

export interface WorldElement {
  createdAt: string
  description: string | null
  id: string
  name: string
  traits: Trait[]
  type: WorldElementType
  updatedAt: string
}

export interface WorldElementInput {
  description?: string
  name?: string
  traits?: Trait[]
  type?: WorldElementType
}

export interface CharacterGroup {
  createdAt: string
  description: string | null
  id: string
  memberIds: string[]
  name: string
  updatedAt: string
}

export interface CharacterGroupInput {
  description?: string
  memberIds?: string[]
  name?: string
}

export interface Note {
  content: string | null
  createdAt: string
  id: string
  title: string
  updatedAt: string
}

export interface NoteInput {
  content?: string
  title?: string
}

export interface GenerateOptionsResult {
  model?: string | null
  options: string[]
  provider?: string
}

const asOptions = (response: unknown): GenerateOptionsResult => {
  const record = (response ?? {}) as Record<string, unknown>
  return {
    options: Array.isArray(record.options)
      ? record.options.filter((item): item is string => typeof item === "string")
      : [],
    provider: typeof record.provider === "string" ? record.provider : undefined,
    model: typeof record.model === "string" ? record.model : null,
  }
}

export const storyBibleApi = {
  worldElements: {
    async list(projectId: string): Promise<WorldElement[]> {
      const response = await apiCall(`/api/projects/${projectId}/world-elements`)
      return Array.isArray(response?.worldElements) ? response.worldElements : []
    },
    async get(projectId: string, id: string): Promise<WorldElement> {
      const response = await apiCall(`/api/projects/${projectId}/world-elements/${id}`)
      if (!response?.worldElement) {
        throw new Error("Worldbuilding element not found")
      }
      return response.worldElement
    },
    create(projectId: string, data: WorldElementInput) {
      return apiCall(`/api/projects/${projectId}/world-elements`, {
        method: "POST",
        body: JSON.stringify(data),
      }) as Promise<{ success: boolean; id: string }>
    },
    update(projectId: string, id: string, data: WorldElementInput) {
      return apiCall(`/api/projects/${projectId}/world-elements/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }) as Promise<{ success: boolean }>
    },
    delete(projectId: string, id: string) {
      return apiCall(`/api/projects/${projectId}/world-elements/${id}`, {
        method: "DELETE",
      }) as Promise<{ success: boolean }>
    },
    async generateTrait(
      projectId: string,
      id: string,
      label: string,
      instructions?: string
    ): Promise<GenerateOptionsResult> {
      return asOptions(
        await apiCall(`/api/projects/${projectId}/world-elements/${id}/generate-trait`, {
          method: "POST",
          body: JSON.stringify({ label, instructions }),
        })
      )
    },
  },

  characterGroups: {
    async list(projectId: string): Promise<CharacterGroup[]> {
      const response = await apiCall(`/api/projects/${projectId}/character-groups`)
      return Array.isArray(response?.characterGroups) ? response.characterGroups : []
    },
    async get(projectId: string, id: string): Promise<CharacterGroup> {
      const response = await apiCall(`/api/projects/${projectId}/character-groups/${id}`)
      if (!response?.characterGroup) {
        throw new Error("Character group not found")
      }
      return response.characterGroup
    },
    create(projectId: string, data: CharacterGroupInput) {
      return apiCall(`/api/projects/${projectId}/character-groups`, {
        method: "POST",
        body: JSON.stringify(data),
      }) as Promise<{ success: boolean; id: string }>
    },
    update(projectId: string, id: string, data: CharacterGroupInput) {
      return apiCall(`/api/projects/${projectId}/character-groups/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }) as Promise<{ success: boolean }>
    },
    delete(projectId: string, id: string) {
      return apiCall(`/api/projects/${projectId}/character-groups/${id}`, {
        method: "DELETE",
      }) as Promise<{ success: boolean }>
    },
  },

  notes: {
    async list(projectId: string): Promise<Note[]> {
      const response = await apiCall(`/api/projects/${projectId}/notes`)
      return Array.isArray(response?.notes) ? response.notes : []
    },
    async get(projectId: string, id: string): Promise<Note> {
      const response = await apiCall(`/api/projects/${projectId}/notes/${id}`)
      if (!response?.note) {
        throw new Error("Note not found")
      }
      return response.note
    },
    create(projectId: string, data: NoteInput) {
      return apiCall(`/api/projects/${projectId}/notes`, {
        method: "POST",
        body: JSON.stringify(data),
      }) as Promise<{ success: boolean; id: string }>
    },
    update(projectId: string, id: string, data: NoteInput) {
      return apiCall(`/api/projects/${projectId}/notes/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }) as Promise<{ success: boolean }>
    },
    delete(projectId: string, id: string) {
      return apiCall(`/api/projects/${projectId}/notes/${id}`, {
        method: "DELETE",
      }) as Promise<{ success: boolean }>
    },
  },

  async generateCharacterTrait(
    projectId: string,
    characterId: string,
    label: string,
    instructions?: string
  ): Promise<GenerateOptionsResult> {
    return asOptions(
      await apiCall(`/api/projects/${projectId}/characters/${characterId}/generate-trait`, {
        method: "POST",
        body: JSON.stringify({ label, instructions }),
      })
    )
  },

  async generateStyle(projectId: string, instructions?: string): Promise<GenerateOptionsResult> {
    return asOptions(
      await apiCall(`/api/projects/${projectId}/style/generate`, {
        method: "POST",
        body: JSON.stringify({ instructions }),
      })
    )
  },

  async generateChapterSynopsis(
    projectId: string,
    chapterId: string,
    instructions?: string
  ): Promise<GenerateOptionsResult> {
    return asOptions(
      await apiCall(`/api/projects/${projectId}/chapters/${chapterId}/synopsis`, {
        method: "POST",
        body: JSON.stringify({ instructions }),
      })
    )
  },

  async generateChapterBraindump(
    projectId: string,
    chapterId: string,
    instructions?: string
  ): Promise<string> {
    const response = await apiCall(`/api/projects/${projectId}/chapters/${chapterId}/braindump`, {
      method: "POST",
      body: JSON.stringify({ instructions }),
    })
    return typeof response?.text === "string" ? response.text : ""
  },

  async generateProjectBraindump(projectId: string, instructions?: string): Promise<string> {
    const response = await apiCall(`/api/projects/${projectId}/braindump/generate`, {
      method: "POST",
      body: JSON.stringify({ instructions }),
    })
    return typeof response?.text === "string" ? response.text : ""
  },
}
