import { eq } from "drizzle-orm"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { db } from "./db"
import { novel } from "./db/schema/novel"
import { getAuth } from "./lib/auth"
import { openApiApp } from "./lib/openapi"
import { apiRouter } from "./routers"
// Import route definitions to register them
import "./routes/health"
import "./routes/user"

interface Env {
  ASSETS: Fetcher
  CORS_ORIGIN: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
}

const app = new Hono<{ Bindings: Env }>()

app.use(logger())

// CORS configuration - must be before routes
app.use(
  "/*",
  cors({
    origin: (origin) => {
      // Allow requests from the web app during development
      const allowedOrigins = [
        "http://localhost:3001", // Web app dev server
        "https://localhost:3001", // Web app dev server (HTTPS)
      ]

      // Allow same-origin requests (no origin header) by returning the origin
      if (!origin) {
        return origin || undefined
      }

      // Check if origin is in allowed list and return the origin if allowed
      if (allowedOrigins.includes(origin)) {
        return origin
      }

      // Reject other origins
      return
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

// Real API endpoints using database
app.get("/api/novels", async (c) => {
  try {
    const novels = await db.select().from(novel)
    return c.json(novels)
  } catch {
    return c.json({ error: "Failed to fetch novels" }, 500)
  }
})

app.get("/api/novels/:id", async (c) => {
  try {
    const id = c.req.param("id")
    const [novelRecord] = await db.select().from(novel).where(eq(novel.id, id))

    if (!novelRecord) {
      return c.json({ error: "Novel not found" }, 404)
    }

    return c.json(novelRecord)
  } catch {
    return c.json({ error: "Failed to fetch novel" }, 500)
  }
})

app.post("/api/novels", async (c) => {
  try {
    const body = await c.req.json()
    const novelData = {
      id: crypto.randomUUID(),
      title: body.title || "Untitled Novel",
      description: body.description || null,
      genre: body.genre || null,
      targetWordCount: body.targetWordCount || null,
      currentWordCount: 0,
      status: "draft" as const,
      visibility: body.visibility || ("private" as const),
      ownerId: "temp-user-id", // TODO: Get from auth session
      organizationId: "temp-org-id", // TODO: Get from auth session
      coverImage: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: null,
      lastWrittenAt: null,
    }

    const [newNovel] = await db.insert(novel).values(novelData).returning()
    return c.json(newNovel)
  } catch {
    return c.json({ error: "Failed to create novel" }, 500)
  }
})

// Mount API routes
app.route("/api", apiRouter)

// Mount OpenAPI routes
app.route("/api", openApiApp)

// Legacy API routes (keeping existing functionality)
app.get("/api/health-legacy", (c) => c.json({ status: "ok" }))

app.get("/api/auth/*", async (c) => {
  const auth = getAuth(c.env)
  return await auth.handler(c.req.raw)
})

app.post("/api/auth/*", async (c) => {
  const auth = getAuth(c.env)
  return await auth.handler(c.req.raw)
})

app.get("/api/session", async (c) => {
  try {
    const auth = getAuth(c.env)
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (!session) {
      return c.json({ authenticated: false, session: null })
    }

    return c.json({
      authenticated: true,
      session: {
        user: session.user,
      },
    })
  } catch (error) {
    return c.json(
      {
        authenticated: false,
        session: null,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    )
  }
})

app.get("/api/private-data", async (c) => {
  try {
    const auth = getAuth(c.env)
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (!session?.user) {
      return c.json({ error: "Unauthorized" }, 401)
    }

    return c.json({
      message: "This is private data",
      user: session.user,
    })
  } catch (_error) {
    return c.json({ error: "Internal server error" }, 500)
  }
})

// Export the Hono app - with run_worker_first: true,
// unhandled routes will fall through to static assets
app.get("*", async (c) => {
  const url = new URL(c.req.url)

  // If this is an API route that wasn't handled above, return 404
  if (url.pathname.startsWith("/api/")) {
    return c.notFound()
  }

  // For SPA: serve static files or fallback to index.html for client-side routing
  try {
    const assetResponse = await c.env.ASSETS.fetch(c.req.raw)
    return assetResponse
  } catch (_error) {
    return c.notFound()
  }
})

export default app
