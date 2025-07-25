/**
 * Centralized API client exports
 *
 * This file exports all API clients in a structured way.
 * Import specific clients or the entire API object as needed.
 */

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
export { apiCall } from "./base"
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

import { aiProvidersApi } from "./ai-providers"
import { novelApi, projectApi } from "./projects"

// Future API clients will be exported here:
// export { chapterApi } from "./chapters"
// export { characterApi } from "./characters"
// export { organizationApi } from "./organizations"

/**
 * Combined API object for convenient access
 */
export const api = {
  projects: projectApi,
  novels: novelApi, // Legacy support
  aiProviders: aiProvidersApi,
  // chapters: chapterApi,
  // characters: characterApi,
  // organizations: organizationApi,
}
