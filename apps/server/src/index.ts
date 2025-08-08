import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
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
// CORS using Cloudflare bindings for dynamic allowed origin
app.use("/*", (c, next) => {
  const allowedOrigins = [
    c.env.CORS_ORIGIN,
    "http://localhost:3001",
    "https://localhost:3001",
  ].filter(Boolean) as string[]

  const corsMiddleware = cors({
    origin: (origin) => {
      // Allow same-origin requests (no origin header)
      if (!origin) {
        return origin || undefined
      }
      if (allowedOrigins.includes(origin)) {
        return origin
      }
      return
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })

  return corsMiddleware(c, next)
})

// Public health endpoint at root (no auth)
app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString(), version: "1.0.0" })
)

// Forward all auth-related requests early to BetterAuth, before mounting other /api routes
app.all("/api/auth/*", async (c) => {
  const auth = getAuth(c.env)
  return await auth.handler(c.req.raw)
})

// Mount OpenAPI routes first so public endpoints like /api/health are not shadowed
app.route("/api", openApiApp)

// Mount API routes (protected and application-specific)
app.route("/api", apiRouter)

// Legacy API routes (keeping existing functionality)
app.get("/api/health-legacy", (c) => c.json({ status: "ok" }))

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
