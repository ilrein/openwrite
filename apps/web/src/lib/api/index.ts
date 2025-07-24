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
export type { CreateNovelData, Novel, UpdateNovelData } from "./novels"
// Novel API
export { novelApi } from "./novels"

import { aiProvidersApi } from "./ai-providers"
import { novelApi } from "./novels"

// Future API clients will be exported here:
// export { chapterApi } from "./chapters"
// export { characterApi } from "./characters"
// export { organizationApi } from "./organizations"

/**
 * Combined API object for convenient access
 */
export const api = {
  novels: novelApi,
  aiProviders: aiProvidersApi,
  // chapters: chapterApi,
  // characters: characterApi,
  // organizations: organizationApi,
}
