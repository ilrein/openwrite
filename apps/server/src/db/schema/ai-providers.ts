import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core"
import { user } from "./auth"

export const aiProvider = sqliteTable(
  "ai_provider",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Provider details
    provider: text("provider", {
      enum: ["openrouter", "openai", "anthropic", "ollama", "groq", "gemini", "cohere"],
    }).notNull(),
    providerUserId: text("provider_user_id"), // User ID from the provider (e.g., OpenRouter user ID)

    // API key details
    apiKey: text("api_key").notNull(), // Encrypted API key
    keyHash: text("key_hash"), // Hash of the API key for identification (for providers like OpenRouter)
    keyLabel: text("key_label"), // Optional label/name for the key

    // Provider-specific metadata
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false), // Default provider for this type

    // Usage and limits (optional, for providers that support it)
    usageLimit: integer("usage_limit"), // Credit/usage limit in cents or provider units
    usageRemaining: integer("usage_remaining"), // Remaining credits/usage
    currentUsage: integer("current_usage").default(0), // Current usage in provider units

    // Timestamps
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
    lastUsedAt: integer("last_used_at", { mode: "timestamp" }),

    // OAuth/connection details
    accessToken: text("access_token"), // For OAuth providers
    refreshToken: text("refresh_token"), // For token refresh
    tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),

    // Provider capabilities/config
    supportedModels: text("supported_models"), // JSON array of supported model IDs
    providerConfig: text("provider_config"), // JSON config specific to provider
  },
  (table) => ({
    // Unique constraint: each user can have only one configuration per provider
    userProviderUnique: unique("ai_provider_user_provider_unique").on(table.userId, table.provider),
  })
)

// Indexes for efficient lookups
// Note: userId + provider combination is already indexed by the unique constraint
export const aiProviderIndexes = {
  // Index for finding active providers for a user
  userActiveIdx:
    "CREATE INDEX IF NOT EXISTS ai_provider_user_active_idx ON ai_provider(user_id, is_active)",
  // Index for finding default providers for a user
  userDefaultIdx:
    "CREATE INDEX IF NOT EXISTS ai_provider_user_default_idx ON ai_provider(user_id, is_default)",
  // Index for timestamp-based queries (recent usage, cleanup)
  lastUsedIdx: "CREATE INDEX IF NOT EXISTS ai_provider_last_used_idx ON ai_provider(last_used_at)",
  // Index for provider-specific queries (admin/analytics)
  providerIdx: "CREATE INDEX IF NOT EXISTS ai_provider_provider_idx ON ai_provider(provider)",
}
