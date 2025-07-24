import { and, eq } from "drizzle-orm"
import { type Context, Hono } from "hono"
import { db } from "../db"
import { aiProvider, member, organization } from "../db/schema"
import { getAuth } from "../lib/auth"

interface Env {
  CORS_ORIGIN: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
}

interface Variables {
  user: {
    id: string
    email: string
    name: string
  }
  session: {
    id: string
    userId: string
  }
  activeOrganization: {
    id: string
    name: string
    slug: string
  } | null
}

const aiProvidersRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

// Middleware to get authenticated user and active organization
const requireAuth = async (
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: () => Promise<void>
) => {
  try {
    const auth = getAuth(c.env)
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (!session?.user) {
      return c.json({ error: "Unauthorized" }, 401)
    }

    c.set("user", session.user)
    c.set("session", session.session)

    // Get user's active organization (first organization they're a member of for now)
    const userMembership = await db
      .select({
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, session.user.id))
      .limit(1)
      .get()

    if (userMembership) {
      c.set("activeOrganization", userMembership.organization)
    } else {
      // For AI providers, we allow requests without an organization
      c.set("activeOrganization", null)
    }
    await next()
  } catch (_error) {
    return c.json({ error: "Authentication failed" }, 401)
  }
}

// Apply auth middleware to all routes
aiProvidersRouter.use("*", requireAuth)

// List user's AI providers
aiProvidersRouter.get("/", async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
  const user = c.get("user")

  const providers = await db
    .select({
      id: aiProvider.id,
      provider: aiProvider.provider,
      keyLabel: aiProvider.keyLabel,
      isActive: aiProvider.isActive,
      isDefault: aiProvider.isDefault,
      usageLimit: aiProvider.usageLimit,
      usageRemaining: aiProvider.usageRemaining,
      currentUsage: aiProvider.currentUsage,
      createdAt: aiProvider.createdAt,
      lastUsedAt: aiProvider.lastUsedAt,
    })
    .from(aiProvider)
    .where(eq(aiProvider.userId, user.id))
    .orderBy(aiProvider.createdAt)

  return c.json({
    providers: providers.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      lastUsedAt: p.lastUsedAt?.toISOString() || null,
    })),
  })
})

// Create new AI provider
aiProvidersRouter.post("/", async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
  const user = c.get("user")

  try {
    const body = await c.req.json()
    const {
      provider,
      apiKey,
      keyLabel,
      keyHash,
      providerUserId,
      isDefault = false,
      usageLimit,
      supportedModels,
      providerConfig,
    } = body

    if (!(provider && apiKey)) {
      return c.json({ error: "Provider and API key are required" }, 400)
    }

    // If this should be the default, unset other defaults for this provider type
    if (isDefault) {
      await db
        .update(aiProvider)
        .set({ isDefault: false })
        .where(and(eq(aiProvider.userId, user.id), eq(aiProvider.provider, provider)))
    }

    const id = crypto.randomUUID()
    const now = new Date()

    await db.insert(aiProvider).values({
      id,
      userId: user.id,
      provider,
      apiKey, // In production, this should be encrypted
      keyLabel: keyLabel || null,
      keyHash: keyHash || null,
      providerUserId: providerUserId || null,
      isActive: true,
      isDefault,
      usageLimit: usageLimit || null,
      currentUsage: 0,
      supportedModels: supportedModels ? JSON.stringify(supportedModels) : null,
      providerConfig: providerConfig ? JSON.stringify(providerConfig) : null,
      createdAt: now,
      updatedAt: now,
    })

    return c.json({ success: true, id })
  } catch (_error) {
    return c.json({ error: "Failed to create AI provider" }, 500)
  }
})

// Update AI provider
aiProvidersRouter.put("/:id", async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
  const providerId = c.req.param("id")
  const user = c.get("user")

  try {
    const body = await c.req.json()
    const { keyLabel, isActive, isDefault, usageLimit, supportedModels, providerConfig } = body

    // If this should be the default, unset other defaults for this provider type
    if (isDefault) {
      const existingProvider = await db
        .select({ provider: aiProvider.provider })
        .from(aiProvider)
        .where(and(eq(aiProvider.id, providerId), eq(aiProvider.userId, user.id)))
        .limit(1)
        .get()

      if (existingProvider) {
        await db
          .update(aiProvider)
          .set({ isDefault: false })
          .where(
            and(eq(aiProvider.userId, user.id), eq(aiProvider.provider, existingProvider.provider))
          )
      }
    }

    await db
      .update(aiProvider)
      .set({
        keyLabel: keyLabel !== undefined ? keyLabel : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined,
        usageLimit: usageLimit !== undefined ? usageLimit : undefined,
        supportedModels: supportedModels ? JSON.stringify(supportedModels) : undefined,
        providerConfig: providerConfig ? JSON.stringify(providerConfig) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(aiProvider.id, providerId), eq(aiProvider.userId, user.id)))

    return c.json({ success: true })
  } catch (_error) {
    return c.json({ error: "Failed to update AI provider" }, 500)
  }
})

// Delete AI provider
aiProvidersRouter.delete("/:id", async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
  const providerId = c.req.param("id")
  const user = c.get("user")

  try {
    await db
      .delete(aiProvider)
      .where(and(eq(aiProvider.id, providerId), eq(aiProvider.userId, user.id)))

    return c.json({ success: true })
  } catch (_error) {
    return c.json({ error: "Failed to delete AI provider" }, 500)
  }
})

// Get specific provider details (without API key)
aiProvidersRouter.get("/:id", async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
  const providerId = c.req.param("id")
  const user = c.get("user")

  const provider = await db
    .select({
      id: aiProvider.id,
      provider: aiProvider.provider,
      providerUserId: aiProvider.providerUserId,
      keyLabel: aiProvider.keyLabel,
      keyHash: aiProvider.keyHash,
      isActive: aiProvider.isActive,
      isDefault: aiProvider.isDefault,
      usageLimit: aiProvider.usageLimit,
      usageRemaining: aiProvider.usageRemaining,
      currentUsage: aiProvider.currentUsage,
      createdAt: aiProvider.createdAt,
      updatedAt: aiProvider.updatedAt,
      lastUsedAt: aiProvider.lastUsedAt,
      supportedModels: aiProvider.supportedModels,
      providerConfig: aiProvider.providerConfig,
    })
    .from(aiProvider)
    .where(and(eq(aiProvider.id, providerId), eq(aiProvider.userId, user.id)))
    .limit(1)
    .get()

  if (!provider) {
    return c.json({ error: "Provider not found" }, 404)
  }

  return c.json({
    provider: {
      ...provider,
      createdAt: provider.createdAt.toISOString(),
      updatedAt: provider.updatedAt.toISOString(),
      lastUsedAt: provider.lastUsedAt?.toISOString() || null,
      supportedModels: provider.supportedModels ? JSON.parse(provider.supportedModels) : null,
      providerConfig: provider.providerConfig ? JSON.parse(provider.providerConfig) : null,
    },
  })
})

// Exchange OpenRouter OAuth code for API key
aiProvidersRouter.post(
  "/openrouter/exchange",
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const user = c.get("user")

    try {
      const body = await c.req.json()
      const { code, codeVerifier, codeChallengeMethod } = body

      if (!code) {
        return c.json({ error: "Authorization code is required" }, 400)
      }

      // Exchange code for API key with OpenRouter
      const exchangeResponse = await fetch("https://openrouter.ai/api/v1/auth/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          code_verifier: codeVerifier,
          code_challenge_method: codeChallengeMethod,
        }),
      })

      if (!exchangeResponse.ok) {
        const _errorText = await exchangeResponse.text()
        return c.json({ error: "Failed to exchange code with OpenRouter" }, 400)
      }

      const { key, user_id } = (await exchangeResponse.json()) as { key: string; user_id: string }

      if (!key) {
        return c.json({ error: "No API key received from OpenRouter" }, 400)
      }

      // Check if user already has an OpenRouter provider
      const existingProvider = await db
        .select({ id: aiProvider.id })
        .from(aiProvider)
        .where(and(eq(aiProvider.userId, user.id), eq(aiProvider.provider, "openrouter")))
        .limit(1)
        .get()

      const now = new Date()

      if (existingProvider) {
        // Update existing provider
        await db
          .update(aiProvider)
          .set({
            apiKey: key, // In production, encrypt this
            providerUserId: user_id,
            isActive: true,
            updatedAt: now,
          })
          .where(eq(aiProvider.id, existingProvider.id))

        return c.json({ success: true, id: existingProvider.id })
      }
      // Create new provider
      const id = crypto.randomUUID()

      await db.insert(aiProvider).values({
        id,
        userId: user.id,
        provider: "openrouter",
        apiKey: key, // In production, encrypt this
        providerUserId: user_id,
        keyLabel: "OpenRouter",
        isActive: true,
        isDefault: false,
        currentUsage: 0,
        createdAt: now,
        updatedAt: now,
      })

      return c.json({ success: true, id })
    } catch (_error) {
      return c.json({ error: "Failed to exchange code" }, 500)
    }
  }
)

export { aiProvidersRouter }
