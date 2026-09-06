/**
 * Centralized API client exports
 *
 * This file exports all API clients in a structured way.
 * Import specific clients or the entire API object as needed.
 */

export type { AiChatMessage, AiChatRequest, AiChatResponse } from "./ai"
// AI Chat API
export { aiApi } from "./ai"
export type {
  AiProvider,
  AiProviderDetails,
  CreateAiProviderData,
  OpenRouterExchangeData,
  UpdateAiProviderData,
} from "./ai-providers"
// AI Providers API
export { aiProvidersApi } from "./ai-providers"
export type { ApiClient, ApiRequestOptions } from "./base"
export { ApiError, apiCall } from "./base"
export type {
  Chapter,
  ChapterContent,
  SaveChapterContentResult,
} from "./chapters"
// Chapters API
export { chaptersApi } from "./chapters"
export type {
  Character,
  CreateCharacterData,
  UpdateCharacterData,
} from "./characters"
// Characters API
export { charactersApi, createCharacterApi } from "./characters"
export type { ProjectContent, SaveContentResult } from "./content"
// Writing content API
export { contentApi } from "./content"
export type {
  ConnectionType,
  CreateGraphConnectionData,
  CreateGraphNodeData,
  CreateTextBlockData,
  GraphConnection,
  GraphNode,
  GraphNodeType,
  StoryElementType,
  TextBlock,
  UpdateGraphConnectionData,
  UpdateGraphNodeData,
  UpdateTextBlockData,
} from "./graph"
// Graph API
export { graphApi } from "./graph"
export type {
  CreateLocationData,
  Location,
  UpdateLocationData,
} from "./locations"
// Locations API
export { createLocationApi, locationsApi } from "./locations"
export type {
  CreateLoreData,
  LoreEntry,
  UpdateLoreData,
} from "./lore"
// Lore API
export { createLoreApi, LORE_TYPE_OPTIONS, loreApi } from "./lore"
export type {
  CreatePlotData,
  PlotThread,
  UpdatePlotData,
} from "./plot"
// Plot API
export { createPlotApi, PLOT_STATUS_OPTIONS, PLOT_TYPE_OPTIONS, plotApi } from "./plot"
export type {
  CreateNovelData,
  CreateProjectData,
  Novel,
  Project,
  UpdateNovelData,
  UpdateProjectData,
  Work,
} from "./projects"
// Project API (formerly Novel API)
export { novelApi, projectApi } from "./projects"
export type {
  CharacterGroup,
  CharacterGroupInput,
  CharacterRole,
  GenerateOptionsResult,
  Note,
  NoteInput,
  Trait,
  WorldElement,
  WorldElementInput,
  WorldElementType,
} from "./story-bible"
// Story Bible API (worldbuilding, character groups, AI generation)
export {
  CHARACTER_DEFAULT_TRAIT_LABELS,
  CHARACTER_ROLE_OPTIONS,
  newTrait,
  storyBibleApi,
  traitsFromLabels,
  WORLD_ELEMENT_DEFAULT_TRAIT_LABELS,
  WORLD_ELEMENT_TYPE_OPTIONS,
} from "./story-bible"

import { aiApi } from "./ai"
import { aiProvidersApi } from "./ai-providers"
import { chaptersApi } from "./chapters"
import { charactersApi } from "./characters"
import { contentApi } from "./content"
import { graphApi } from "./graph"
import { locationsApi } from "./locations"
import { loreApi } from "./lore"
import { plotApi } from "./plot"
import { novelApi, projectApi } from "./projects"
import { storyBibleApi } from "./story-bible"

// Future API clients will be exported here:
// export { chapterApi } from "./chapters"
// export { organizationApi } from "./organizations"

/**
 * Combined API object for convenient access
 */
export const api = {
  projects: projectApi,
  novels: novelApi, // Legacy support
  ai: aiApi,
  aiProviders: aiProvidersApi,
  chapters: chaptersApi,
  content: contentApi,
  characters: charactersApi,
  locations: locationsApi,
  lore: loreApi,
  plot: plotApi,
  graph: graphApi,
  storyBible: storyBibleApi,
  // chapters: chapterApi,
  // organizations: organizationApi,
}
