import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { getAuth } from "./lib/auth"

interface Env {
  ASSETS: Fetcher
  CORS_ORIGIN: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
}

const app = new Hono<{ Bindings: Env }>()

app.use(logger())
app.use(
  "/*",
  cors({
    origin: "*", // Will be configured properly via environment variables in production
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

// API routes
app.get("/api/health", (c) => c.json({ status: "ok" }))

app.get("/api/auth/*", async (c) => {
  const auth = getAuth(c.env)
  return auth.handler(c.req.raw)
})

app.post("/api/auth/*", async (c) => {
  const auth = getAuth(c.env)
  return auth.handler(c.req.raw)
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
  } catch (error) {
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
  } catch (error) {
    console.error("Assets fetch error:", error)
    return c.notFound()
  }
})

export default app
