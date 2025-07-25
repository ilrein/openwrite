/**
 * AI Providers API Client
 *
 * Handles all API calls related to AI provider management
 */

import { apiCall } from "./base"

export interface AiProvider {
  id: string
  provider: "openrouter" | "openai" | "anthropic" | "ollama" | "groq" | "gemini" | "cohere"
  keyLabel: string | null
  keyHash: string | null
  isActive: boolean
  isDefault: boolean
  usageLimit: number | null
  usageRemaining: number | null
  currentUsage: number
  createdAt: string
  lastUsedAt: string | null
}

export interface AiProviderDetails extends AiProvider {
  providerUserId: string | null
  updatedAt: string
  supportedModels: string[] | null
  providerConfig: Record<string, unknown> | null
}

export interface CreateAiProviderData {
  provider: "openrouter" | "openai" | "anthropic" | "ollama" | "groq" | "gemini" | "cohere"
  apiKey?: string
  apiUrl?: string
  configuration?: Record<string, unknown>
  keyLabel?: string
  keyHash?: string
  providerUserId?: string
  isDefault?: boolean
  usageLimit?: number
  supportedModels?: string[]
  providerConfig?: Record<string, unknown>
}

export interface UpdateAiProviderData {
  keyLabel?: string
  isActive?: boolean
  isDefault?: boolean
  usageLimit?: number | null
  supportedModels?: string[]
  providerConfig?: Record<string, unknown>
}

export interface OpenRouterExchangeData {
  code: string
  codeVerifier?: string
  codeChallengeMethod?: "S256" | "plain"
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
}
