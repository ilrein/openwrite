import { Hono, type Context } from "hono"
import { getAuth } from "../lib/auth"
import { db } from "../db"
import { novel, organization, member } from "../db/schema"
import { eq, and, desc } from "drizzle-orm"

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
const requireAuth = async (c: Context<{ Bindings: Env; Variables: Variables }>, next: () => Promise<void>) => {
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
          slug: organization.slug
        }
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
router.post("/organization/create-personal", requireAuth, async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
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
    slug: `${user.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    createdAt: now,
    updatedAt: now
  })

  // Add user as owner
  await db.insert(member).values({
    id: memberId,
    userId: user.id,
    organizationId: orgId,
    role: "owner",
    createdAt: now
  })

  return c.json({ 
    success: true, 
    organization: { id: orgId, name: `${user.name}'s Workspace` } 
  })
})

// List novels
router.get("/novels", requireAuth, async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
  const activeOrganization = c.get("activeOrganization")
  
  // If user has no organization, return indication that they need to create one
  if (!activeOrganization) {
    return c.json({ novels: [], needsOrganization: true })
  }
  
  const novels = await db
    .select({
      id: novel.id,
      title: novel.title,
      description: novel.description,
      genre: novel.genre,
      status: novel.status,
      visibility: novel.visibility,
      currentWordCount: novel.currentWordCount,
      targetWordCount: novel.targetWordCount,
      coverImage: novel.coverImage,
      createdAt: novel.createdAt,
      updatedAt: novel.updatedAt,
      lastWrittenAt: novel.lastWrittenAt
    })
    .from(novel)
    .where(eq(novel.organizationId, activeOrganization.id))
    .orderBy(desc(novel.updatedAt))

  return c.json({
    novels: novels.map(n => ({
      ...n,
      currentWordCount: n.currentWordCount ?? 0,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
      lastWrittenAt: n.lastWrittenAt?.toISOString() || null
    }))
  })
})

// Get a specific novel
router.get("/novels/:id", requireAuth, async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
  const novelId = c.req.param("id")
  const activeOrganization = c.get("activeOrganization")
  
  if (!activeOrganization) {
    return c.json({ error: "No organization found" }, 400)
  }
  
  const novelData = await db
    .select()
    .from(novel)
    .where(
      and(
        eq(novel.id, novelId),
        eq(novel.organizationId, activeOrganization.id)
      )
    )
    .get()

  if (!novelData) {
    return c.json({ error: "Novel not found" }, 404)
  }

  return c.json({
    novel: {
      ...novelData,
      currentWordCount: novelData.currentWordCount ?? 0,
      createdAt: novelData.createdAt.toISOString(),
      updatedAt: novelData.updatedAt.toISOString(),
      lastWrittenAt: novelData.lastWrittenAt?.toISOString() || null
    }
  })
})

// Create a new novel
router.post("/novels", requireAuth, async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
  const user = c.get("user")
  const activeOrganization = c.get("activeOrganization")
  
  if (!activeOrganization) {
    return c.json({ error: "No organization found" }, 400)
  }
  
  try {
    const body = await c.req.json()
    const { title, description, genre, targetWordCount, visibility = "private" } = body

    if (!title || title.trim().length === 0) {
      return c.json({ error: "Title is required" }, 400)
    }

    const id = crypto.randomUUID()
    const now = new Date()

    await db.insert(novel).values({
      id,
      title: title.trim(),
      description: description?.trim() || null,
      genre: genre?.trim() || null,
      targetWordCount: targetWordCount ? Number.parseInt(targetWordCount, 10) : null,
      currentWordCount: 0,
      status: "draft",
      visibility,
      ownerId: user.id,
      organizationId: activeOrganization.id,
      createdAt: now,
      updatedAt: now
    })

    return c.json({ success: true, id })
  } catch (_error) {
    return c.json({ error: "Failed to create novel" }, 500)
  }
})

// Update a novel
router.put("/novels/:id", requireAuth, async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
  const novelId = c.req.param("id")
  const user = c.get("user")
  const activeOrganization = c.get("activeOrganization")
  
  try {
    const body = await c.req.json()
    const updateData = { ...body, updatedAt: new Date() }
    
    await db
      .update(novel)
      .set(updateData)
      .where(
        and(
          eq(novel.id, novelId),
          eq(novel.organizationId, activeOrganization.id),
          eq(novel.ownerId, user.id) // Only owner can update
        )
      )

    return c.json({ success: true })
  } catch (_error) {
    return c.json({ error: "Failed to update novel" }, 500)
  }
})

// Delete a novel
router.delete("/novels/:id", requireAuth, async (c: Context<{ Bindings: Env; Variables: Variables }>) => {
  const novelId = c.req.param("id")
  const user = c.get("user")
  const activeOrganization = c.get("activeOrganization")
  
  try {
    await db
      .delete(novel)
      .where(
        and(
          eq(novel.id, novelId),
          eq(novel.organizationId, activeOrganization.id),
          eq(novel.ownerId, user.id) // Only owner can delete
        )
      )

    return c.json({ success: true })
  } catch (_error) {
    return c.json({ error: "Failed to delete novel" }, 500)
  }
})

export { router as apiRouter }