import { and, desc, eq } from "drizzle-orm"
import { type Context, Hono } from "hono"
import { db } from "../db"
import { character, member, organization, project } from "../db/schema"
import { getAuth } from "../lib/auth"
import { aiProvidersRouter } from "./ai-providers"

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

const router = new Hono<{ Bindings: Env; Variables: Variables }>()

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
      // For certain endpoints, we allow requests without an organization
      // The dashboard can handle the case where user needs to create an organization
      c.set("activeOrganization", null)
    }
    await next()
  } catch (_error) {
    return c.json({ error: "Authentication failed" }, 401)
  }
}

// Create organization for new users (auto-created personal org)
router.post(
  "/organization/create-personal",
  requireAuth,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const user = c.get("user")

    // Check if user already has an organization
    const existingMembership = await db
      .select()
      .from(member)
      .where(eq(member.userId, user.id))
      .limit(1)
      .get()

    if (existingMembership) {
      return c.json({ error: "User already has an organization" }, 400)
    }

    const orgId = crypto.randomUUID()
    const memberId = crypto.randomUUID()
    const now = new Date()

    // Create personal organization
    await db.insert(organization).values({
      id: orgId,
      name: `${user.name}'s Workspace`,
      slug: `${user.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    })

    // Add user as owner
    await db.insert(member).values({
      id: memberId,
      userId: user.id,
      organizationId: orgId,
      role: "owner",
      createdAt: now,
    })

    return c.json({
      success: true,
      organization: { id: orgId, name: `${user.name}'s Workspace` },
    })
  }
)

// List projects
router.get(
  "/projects",
  requireAuth,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const activeOrganization = c.get("activeOrganization")

    // If user has no organization, return indication that they need to create one
    if (!activeOrganization) {
      return c.json({ projects: [], needsOrganization: true })
    }

    const projects = await db
      .select({
        id: project.id,
        title: project.title,
        description: project.description,
        type: project.type,
        genre: project.genre,
        status: project.status,
        visibility: project.visibility,
        currentWordCount: project.currentWordCount,
        targetWordCount: project.targetWordCount,
        coverImage: project.coverImage,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        lastWrittenAt: project.lastWrittenAt,
      })
      .from(project)
      .where(eq(project.organizationId, activeOrganization.id))
      .orderBy(desc(project.updatedAt))

    return c.json({
      projects: projects.map((p) => ({
        ...p,
        currentWordCount: p.currentWordCount ?? 0,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        lastWrittenAt: p.lastWrittenAt?.toISOString() || null,
      })),
    })
  }
)

// Get a specific project
router.get(
  "/projects/:id",
  requireAuth,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("id")
    const activeOrganization = c.get("activeOrganization")

    if (!activeOrganization) {
      return c.json({ error: "No organization found" }, 400)
    }

    const projectData = await db
      .select()
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.organizationId, activeOrganization.id)))
      .get()

    if (!projectData) {
      return c.json({ error: "Project not found" }, 404)
    }

    return c.json({
      project: {
        ...projectData,
        currentWordCount: projectData.currentWordCount ?? 0,
        createdAt: projectData.createdAt.toISOString(),
        updatedAt: projectData.updatedAt.toISOString(),
        lastWrittenAt: projectData.lastWrittenAt?.toISOString() || null,
      },
    })
  }
)

// Create a new project
router.post(
  "/projects",
  requireAuth,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const user = c.get("user")
    const activeOrganization = c.get("activeOrganization")

    if (!activeOrganization) {
      return c.json({ error: "No organization found" }, 400)
    }

    try {
      const body = await c.req.json()
      const {
        title,
        description,
        type = "novel",
        genre,
        targetWordCount,
        visibility = "private",
      } = body

      if (!title || title.trim().length === 0) {
        return c.json({ error: "Title is required" }, 400)
      }

      const id = crypto.randomUUID()
      const now = new Date()

      await db.insert(project).values({
        id,
        title: title.trim(),
        description: description?.trim() || null,
        type,
        genre: genre?.trim() || null,
        targetWordCount: targetWordCount ? Number.parseInt(targetWordCount, 10) : null,
        currentWordCount: 0,
        status: "draft",
        visibility,
        ownerId: user.id,
        organizationId: activeOrganization.id,
        createdAt: now,
        updatedAt: now,
      })

      return c.json({ success: true, id })
    } catch (_error) {
      return c.json({ error: "Failed to create project" }, 500)
    }
  }
)

// Update a project
router.put(
  "/projects/:id",
  requireAuth,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("id")
    const user = c.get("user")
    const activeOrganization = c.get("activeOrganization")

    try {
      const body = await c.req.json()
      const updateData = { ...body, updatedAt: new Date() }

      if (!activeOrganization) {
        return c.json({ error: "No organization found" }, 400)
      }

      await db
        .update(project)
        .set(updateData)
        .where(
          and(
            eq(project.id, projectId),
            eq(project.organizationId, activeOrganization.id),
            eq(project.ownerId, user.id) // Only owner can update
          )
        )

      return c.json({ success: true })
    } catch (_error) {
      return c.json({ error: "Failed to update project" }, 500)
    }
  }
)

// Delete a project
router.delete(
  "/projects/:id",
  requireAuth,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("id")
    const user = c.get("user")
    const activeOrganization = c.get("activeOrganization")

    try {
      if (!activeOrganization) {
        return c.json({ error: "No organization found" }, 400)
      }

      await db.delete(project).where(
        and(
          eq(project.id, projectId),
          eq(project.organizationId, activeOrganization.id),
          eq(project.ownerId, user.id) // Only owner can delete
        )
      )

      return c.json({ success: true })
    } catch (_error) {
      return c.json({ error: "Failed to delete project" }, 500)
    }
  }
)

// List characters for a project
router.get(
  "/projects/:projectId/characters",
  requireAuth,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const activeOrganization = c.get("activeOrganization")

    if (!activeOrganization) {
      return c.json({ error: "No organization found" }, 400)
    }

    // Verify project belongs to user's organization
    const projectData = await db
      .select({ id: project.id })
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.organizationId, activeOrganization.id)))
      .get()

    if (!projectData) {
      return c.json({ error: "Project not found" }, 404)
    }

    const characters = await db
      .select({
        id: character.id,
        name: character.name,
        description: character.description,
        role: character.role,
        appearance: character.appearance,
        personality: character.personality,
        backstory: character.backstory,
        motivation: character.motivation,
        image: character.image,
        metadata: character.metadata,
        createdAt: character.createdAt,
        updatedAt: character.updatedAt,
      })
      .from(character)
      .where(eq(character.projectId, projectId))
      .orderBy(character.name)

    return c.json({
      characters: characters.map((char) => ({
        ...char,
        createdAt: char.createdAt.toISOString(),
        updatedAt: char.updatedAt.toISOString(),
      })),
    })
  }
)

// Get a specific character
router.get(
  "/projects/:projectId/characters/:characterId",
  requireAuth,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const characterId = c.req.param("characterId")
    const activeOrganization = c.get("activeOrganization")

    if (!activeOrganization) {
      return c.json({ error: "No organization found" }, 400)
    }

    // Verify project belongs to user's organization
    const projectData = await db
      .select({ id: project.id })
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.organizationId, activeOrganization.id)))
      .get()

    if (!projectData) {
      return c.json({ error: "Project not found" }, 404)
    }

    const characterData = await db
      .select()
      .from(character)
      .where(and(eq(character.id, characterId), eq(character.projectId, projectId)))
      .get()

    if (!characterData) {
      return c.json({ error: "Character not found" }, 404)
    }

    return c.json({
      character: {
        ...characterData,
        createdAt: characterData.createdAt.toISOString(),
        updatedAt: characterData.updatedAt.toISOString(),
      },
    })
  }
)

// Create a new character
router.post(
  "/projects/:projectId/characters",
  requireAuth,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const activeOrganization = c.get("activeOrganization")

    if (!activeOrganization) {
      return c.json({ error: "No organization found" }, 400)
    }

    // Verify project belongs to user's organization
    const projectData = await db
      .select({ id: project.id })
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.organizationId, activeOrganization.id)))
      .get()

    if (!projectData) {
      return c.json({ error: "Project not found" }, 404)
    }

    try {
      const body = await c.req.json()
      const {
        name,
        description,
        role,
        appearance,
        personality,
        backstory,
        motivation,
        image,
        metadata,
      } = body

      if (!name || name.trim().length === 0) {
        return c.json({ error: "Name is required" }, 400)
      }

      const id = crypto.randomUUID()
      const now = new Date()

      await db.insert(character).values({
        id,
        name: name.trim(),
        description: description?.trim() || null,
        role: role || null,
        appearance: appearance?.trim() || null,
        personality: personality?.trim() || null,
        backstory: backstory?.trim() || null,
        motivation: motivation?.trim() || null,
        projectId,
        workId: null, // Project-level character
        image: image || null,
        metadata: metadata || null,
        createdAt: now,
        updatedAt: now,
      })

      return c.json({ success: true, id })
    } catch (_error) {
      return c.json({ error: "Failed to create character" }, 500)
    }
  }
)

// Update a character
router.put(
  "/projects/:projectId/characters/:characterId",
  requireAuth,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const characterId = c.req.param("characterId")
    const activeOrganization = c.get("activeOrganization")

    if (!activeOrganization) {
      return c.json({ error: "No organization found" }, 400)
    }

    // Verify project belongs to user's organization
    const projectData = await db
      .select({ id: project.id })
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.organizationId, activeOrganization.id)))
      .get()

    if (!projectData) {
      return c.json({ error: "Project not found" }, 404)
    }

    try {
      const body = await c.req.json()
      const updateData = { ...body, updatedAt: new Date() }

      // Remove fields that shouldn't be updated
      updateData.id = undefined
      updateData.projectId = undefined
      updateData.workId = undefined
      updateData.createdAt = undefined

      await db
        .update(character)
        .set(updateData)
        .where(and(eq(character.id, characterId), eq(character.projectId, projectId)))

      return c.json({ success: true })
    } catch (_error) {
      return c.json({ error: "Failed to update character" }, 500)
    }
  }
)

// Delete a character
router.delete(
  "/projects/:projectId/characters/:characterId",
  requireAuth,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const characterId = c.req.param("characterId")
    const activeOrganization = c.get("activeOrganization")

    if (!activeOrganization) {
      return c.json({ error: "No organization found" }, 400)
    }

    // Verify project belongs to user's organization
    const projectData = await db
      .select({ id: project.id })
      .from(project)
      .where(and(eq(project.id, projectId), eq(project.organizationId, activeOrganization.id)))
      .get()

    if (!projectData) {
      return c.json({ error: "Project not found" }, 404)
    }

    try {
      await db
        .delete(character)
        .where(and(eq(character.id, characterId), eq(character.projectId, projectId)))

      return c.json({ success: true })
    } catch (_error) {
      return c.json({ error: "Failed to delete character" }, 500)
    }
  }
)

// Mount AI providers router
router.route("/ai-providers", aiProvidersRouter)

export { router as apiRouter }
