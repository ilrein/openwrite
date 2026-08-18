/**
 * AI Providers API Client
 *
 * Handles all API calls related to AI provider management
 */

import { apiCall } from "./base"

/**
 * Centralized provider ID type - single source of truth for all supported providers
 */
export type ProviderId =
  | "openrouter"
  | "openai"
  | "anthropic"
  | "ollama"
  | "groq"
  | "gemini"
  | "cohere"
  | "custom"

export interface AiProvider {
  createdAt: string
  currentUsage: number
  id: string
  isActive: boolean
  isDefault: boolean
  keyHash: string | null
  keyLabel: string | null
  lastUsedAt: string | null
  provider: ProviderId
  usageLimit: number | null
  usageRemaining: number | null
}

export interface AiProviderDetails extends AiProvider {
  providerConfig: Record<string, unknown> | null
  providerUserId: string | null
  supportedModels: string[] | null
  updatedAt: string
}

export interface CreateAiProviderData {
  apiKey?: string
  apiUrl?: string
  configuration?: Record<string, unknown>
  isDefault?: boolean
  keyHash?: string
  keyLabel?: string
  provider: ProviderId
  providerConfig?: Record<string, unknown>
  providerUserId?: string
  supportedModels?: string[]
  usageLimit?: number
}

export interface UpdateAiProviderData {
  isActive?: boolean
  isDefault?: boolean
  keyLabel?: string
  providerConfig?: Record<string, unknown>
  supportedModels?: string[]
  usageLimit?: number | null
}

export interface OpenRouterExchangeData {
  code: string
  codeChallengeMethod?: "S256" | "plain"
  codeVerifier?: string
}

export interface OAuthExchangeData {
  code: string
  codeChallengeMethod: "S256" | "plain"
  codeVerifier: string
  provider: ProviderId
}

/**
 * AI Providers API client
 */
export const aiProvidersApi = {
  /**
   * List all AI providers for the current user
   */
  async list(): Promise<AiProvider[]> {
    const response = (await apiCall("/api/ai-providers", {
      method: "GET",
    })) as { providers: AiProvider[] }
    return response.providers
  },

  /**
   * Create a new AI provider
   */
  async create(data: CreateAiProviderData): Promise<{ success: boolean; id: string }> {
    return (await apiCall("/api/ai-providers", {
      method: "POST",
      body: JSON.stringify(data),
    })) as { success: boolean; id: string }
  },

  /**
   * Update an existing AI provider
   */
  async update(id: string, data: UpdateAiProviderData): Promise<{ success: boolean }> {
    return (await apiCall(`/api/ai-providers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })) as { success: boolean }
  },

  /**
   * Delete an AI provider
   */
  async delete(id: string): Promise<{ success: boolean }> {
    return (await apiCall(`/api/ai-providers/${id}`, {
      method: "DELETE",
    })) as { success: boolean }
  },

  /**
   * Get detailed information about a specific AI provider
   */
  async get(id: string): Promise<AiProviderDetails> {
    const response = (await apiCall(`/api/ai-providers/${id}`, {
      method: "GET",
    })) as { provider: AiProviderDetails }
    return response.provider
  },

  /**
   * Exchange OpenRouter OAuth code for API key
   */
  async exchangeOpenRouterCode(
    data: OpenRouterExchangeData
  ): Promise<{ success: boolean; id: string }> {
    return (await apiCall("/api/ai-providers/openrouter/exchange", {
      method: "POST",
      body: JSON.stringify(data),
    })) as { success: boolean; id: string }
  },

  /**
   * Exchange OAuth code for any supported provider
   */
  async exchangeOAuth(data: OAuthExchangeData): Promise<{ success: boolean; id: string }> {
    return (await apiCall(`/api/ai-providers/${data.provider}/exchange`, {
      method: "POST",
      body: JSON.stringify(data),
    })) as { success: boolean; id: string }
  },
}
