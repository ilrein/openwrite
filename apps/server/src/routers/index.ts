import { and, desc, eq } from "drizzle-orm"
import { type Context, Hono } from "hono"
import { db } from "../db"
import { character, location, lore, member, organization, plotPoint, project } from "../db/schema"
import { requireAuth, verifyProjectAccess } from "../middleware/auth"
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
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")

    const characters = await db
      .select({
        id: character.id,
        name: character.name,
        description: character.description,
        // appearance, personality, backstory, motivation removed - simplified character schema
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
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const characterId = c.req.param("characterId")

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
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")

    try {
      const body = await c.req.json()
      const { name, description, image, metadata } = body

      if (!name || name.trim().length === 0) {
        return c.json({ error: "Name is required" }, 400)
      }

      const id = crypto.randomUUID()
      const now = new Date()

      await db.insert(character).values({
        id,
        name: name.trim(),
        description: description?.trim() || null,
        // appearance, personality, backstory, motivation removed - simplified character schema
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
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const characterId = c.req.param("characterId")

    try {
      const { name, description, image, metadata } = await c.req.json()

      const updateData: Record<string, string | Date | null> = {
        updatedAt: new Date(),
      }

      if (name !== undefined) {
        updateData.name = name
      }
      if (description !== undefined) {
        updateData.description = description
      }
      // appearance, personality, backstory, motivation fields removed - simplified character schema
      if (image !== undefined) {
        updateData.image = image
      }
      if (metadata !== undefined) {
        updateData.metadata = metadata
      }

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
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const characterId = c.req.param("characterId")

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

// List locations for a project
router.get(
  "/projects/:projectId/locations",
  requireAuth,
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")

    const locations = await db
      .select({
        id: location.id,
        name: location.name,
        description: location.description,
        parentLocationId: location.parentLocationId,
        image: location.image,
        metadata: location.metadata,
        createdAt: location.createdAt,
        updatedAt: location.updatedAt,
      })
      .from(location)
      .where(eq(location.projectId, projectId))
      .orderBy(location.name)

    return c.json({
      locations: locations.map((loc) => ({
        ...loc,
        createdAt: loc.createdAt.toISOString(),
        updatedAt: loc.updatedAt.toISOString(),
      })),
    })
  }
)

// Get a specific location
router.get(
  "/projects/:projectId/locations/:locationId",
  requireAuth,
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const locationId = c.req.param("locationId")

    const locationData = await db
      .select()
      .from(location)
      .where(and(eq(location.id, locationId), eq(location.projectId, projectId)))
      .get()

    if (!locationData) {
      return c.json({ error: "Location not found" }, 404)
    }

    return c.json({
      location: {
        ...locationData,
        createdAt: locationData.createdAt.toISOString(),
        updatedAt: locationData.updatedAt.toISOString(),
      },
    })
  }
)

// Create a new location
router.post(
  "/projects/:projectId/locations",
  requireAuth,
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const body = await c.req.json()

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return c.json({ error: "Name is required and cannot be empty" }, 400)
    }

    const id = crypto.randomUUID()
    const now = new Date()

    try {
      await db.insert(location).values({
        id,
        name: body.name,
        description: body.description,
        parentLocationId: body.parentLocationId,
        image: body.image,
        metadata: body.metadata,
        projectId,
        createdAt: now,
        updatedAt: now,
      })

      return c.json({ success: true, id })
    } catch (_error) {
      return c.json({ error: "Failed to create location" }, 500)
    }
  }
)

// Update a location
router.put(
  "/projects/:projectId/locations/:locationId",
  requireAuth,
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const locationId = c.req.param("locationId")
    const body = await c.req.json()

    try {
      await db
        .update(location)
        .set({
          name: body.name,
          description: body.description,
          parentLocationId: body.parentLocationId,
          image: body.image,
          metadata: body.metadata,
          updatedAt: new Date(),
        })
        .where(and(eq(location.id, locationId), eq(location.projectId, projectId)))

      return c.json({ success: true })
    } catch (_error) {
      return c.json({ error: "Failed to update location" }, 500)
    }
  }
)

// Delete a location
router.delete(
  "/projects/:projectId/locations/:locationId",
  requireAuth,
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const locationId = c.req.param("locationId")

    try {
      await db
        .delete(location)
        .where(and(eq(location.id, locationId), eq(location.projectId, projectId)))

      return c.json({ success: true })
    } catch (_error) {
      return c.json({ error: "Failed to delete location" }, 500)
    }
  }
)

// List lore entries for a project
router.get(
  "/projects/:projectId/lore",
  requireAuth,
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")

    const loreEntries = await db
      .select({
        id: lore.id,
        name: lore.name,
        description: lore.description,
        type: lore.type,
        metadata: lore.metadata,
        createdAt: lore.createdAt,
        updatedAt: lore.updatedAt,
      })
      .from(lore)
      .where(eq(lore.projectId, projectId))
      .orderBy(lore.name)

    return c.json({
      lore: loreEntries.map((entry) => ({
        ...entry,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      })),
    })
  }
)

// Get a specific lore entry
router.get(
  "/projects/:projectId/lore/:loreId",
  requireAuth,
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const loreId = c.req.param("loreId")

    const loreData = await db
      .select()
      .from(lore)
      .where(and(eq(lore.id, loreId), eq(lore.projectId, projectId)))
      .get()

    if (!loreData) {
      return c.json({ error: "Lore entry not found" }, 404)
    }

    return c.json({
      lore: {
        ...loreData,
        createdAt: loreData.createdAt.toISOString(),
        updatedAt: loreData.updatedAt.toISOString(),
      },
    })
  }
)

router.post(
  "/projects/:projectId/lore",
  requireAuth,
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const body = await c.req.json()

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return c.json({ error: "Name is required and cannot be empty" }, 400)
    }

    const id = crypto.randomUUID()
    const now = new Date()

    try {
      await db.insert(lore).values({
        id,
        name: body.name,
        description: body.description,
        type: body.type,
        metadata: body.metadata,
        projectId,
        createdAt: now,
        updatedAt: now,
      })

      return c.json({ success: true, id })
    } catch (_error) {
      return c.json({ error: "Failed to create lore entry" }, 500)
    }
  }
)

// Update a lore entry
router.put(
  "/projects/:projectId/lore/:loreId",
  requireAuth,
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const loreId = c.req.param("loreId")
    const body = await c.req.json()

    try {
      await db
        .update(lore)
        .set({
          name: body.name,
          description: body.description,
          type: body.type,
          metadata: body.metadata,
          updatedAt: new Date(),
        })
        .where(and(eq(lore.id, loreId), eq(lore.projectId, projectId)))

      return c.json({ success: true })
    } catch (_error) {
      return c.json({ error: "Failed to update lore entry" }, 500)
    }
  }
)

// Delete a lore entry
router.delete(
  "/projects/:projectId/lore/:loreId",
  requireAuth,
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const loreId = c.req.param("loreId")

    try {
      await db.delete(lore).where(and(eq(lore.id, loreId), eq(lore.projectId, projectId)))

      return c.json({ success: true })
    } catch (_error) {
      return c.json({ error: "Failed to delete lore entry" }, 500)
    }
  }
)

// List plot points for a project
router.get(
  "/projects/:projectId/plot-points",
  requireAuth,
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")

    const plotPoints = await db
      .select({
        id: plotPoint.id,
        title: plotPoint.title,
        description: plotPoint.description,
        type: plotPoint.type,
        order: plotPoint.order,
        status: plotPoint.status,
        chapterId: plotPoint.chapterId,
        createdAt: plotPoint.createdAt,
        updatedAt: plotPoint.updatedAt,
      })
      .from(plotPoint)
      .where(eq(plotPoint.projectId, projectId))
      .orderBy(plotPoint.order)

    return c.json({
      plotPoints: plotPoints.map((point) => ({
        ...point,
        createdAt: point.createdAt.toISOString(),
        updatedAt: point.updatedAt.toISOString(),
      })),
    })
  }
)

// Get a specific plot point
router.get(
  "/projects/:projectId/plot-points/:plotPointId",
  requireAuth,
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const plotPointId = c.req.param("plotPointId")

    const plotPointData = await db
      .select()
      .from(plotPoint)
      .where(and(eq(plotPoint.id, plotPointId), eq(plotPoint.projectId, projectId)))
      .get()

    if (!plotPointData) {
      return c.json({ error: "Plot point not found" }, 404)
    }

    return c.json({
      plotPoint: {
        ...plotPointData,
        createdAt: plotPointData.createdAt.toISOString(),
        updatedAt: plotPointData.updatedAt.toISOString(),
      },
    })
  }
)

// Create a new plot point
router.post(
  "/projects/:projectId/plot-points",
  requireAuth,
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const body = await c.req.json()

    // Validate required fields
    if (!body.title || typeof body.title !== "string" || body.title.trim().length === 0) {
      return c.json({ error: "Title is required and cannot be empty" }, 400)
    }
    if (
      body.order === undefined ||
      typeof body.order !== "number" ||
      !Number.isInteger(body.order) ||
      body.order < 1
    ) {
      return c.json({ error: "Order is required and must be a positive integer" }, 400)
    }

    // Validate optional type field if provided
    const validTypes = [
      "inciting_incident",
      "plot_point_1",
      "midpoint",
      "plot_point_2",
      "climax",
      "resolution",
      "custom",
    ]
    if (
      body.type !== undefined &&
      (!body.type || typeof body.type !== "string" || !validTypes.includes(body.type))
    ) {
      return c.json({ error: `Type must be one of: ${validTypes.join(", ")}` }, 400)
    }

    const id = crypto.randomUUID()
    const now = new Date()

    try {
      await db.insert(plotPoint).values({
        id,
        title: body.title,
        description: body.description,
        type: body.type,
        order: body.order,
        status: body.status || "planned",
        chapterId: body.chapterId,
        projectId,
        createdAt: now,
        updatedAt: now,
      })

      return c.json({ success: true, id })
    } catch (_error) {
      return c.json({ error: "Failed to create plot point" }, 500)
    }
  }
)

// Update a plot point
router.put(
  "/projects/:projectId/plot-points/:plotPointId",
  requireAuth,
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const plotPointId = c.req.param("plotPointId")
    const body = await c.req.json()

    try {
      await db
        .update(plotPoint)
        .set({
          title: body.title,
          description: body.description,
          type: body.type,
          order: body.order,
          status: body.status,
          chapterId: body.chapterId,
          updatedAt: new Date(),
        })
        .where(and(eq(plotPoint.id, plotPointId), eq(plotPoint.projectId, projectId)))

      return c.json({ success: true })
    } catch (_error) {
      return c.json({ error: "Failed to update plot point" }, 500)
    }
  }
)

// Delete a plot point
router.delete(
  "/projects/:projectId/plot-points/:plotPointId",
  requireAuth,
  verifyProjectAccess,
  async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
    const projectId = c.req.param("projectId")
    const plotPointId = c.req.param("plotPointId")

    try {
      await db
        .delete(plotPoint)
        .where(and(eq(plotPoint.id, plotPointId), eq(plotPoint.projectId, projectId)))

      return c.json({ success: true })
    } catch (_error) {
      return c.json({ error: "Failed to delete plot point" }, 500)
    }
  }
)

// Mount AI providers router
router.route("/ai-providers", aiProvidersRouter)

export { router as apiRouter }
