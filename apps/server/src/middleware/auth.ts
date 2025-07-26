import { and, eq } from "drizzle-orm"
import type { Context } from "hono"
import { db } from "../db"
import { member, organization, project } from "../db/schema"
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

// Middleware to get authenticated user and active organization
export const requireAuth = async (
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

// Middleware to verify project access
export const verifyProjectAccess = async (
  c: Context<{ Bindings: Env; Variables: Variables }>,
  next: () => Promise<void>
) => {
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

  await next()
}
