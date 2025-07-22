import { env } from "cloudflare:workers"
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
    origin: env.CORS_ORIGIN ?? "*",
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

// Simple health check endpoint
app.get("/api/health", (c) => c.json({ status: "ok" }))

// Better Auth routes
app.get("/api/auth/*", async (c) => {
  const auth = getAuth(c.env)
  return auth.handler(c.req.raw)
})

app.post("/api/auth/*", async (c) => {
  const auth = getAuth(c.env)
  return auth.handler(c.req.raw)
})

// API endpoints
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
        user: session.user
      }
    })
  } catch (error) {
    console.error("Session check error:", error)
    return c.json({ authenticated: false, session: null, error: error.message }, 500)
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
      user: session.user
    })
  } catch (error) {
    console.error("Private data error:", error)
    return c.json({ error: "Internal server error" }, 500)
  }
})

// Serve static assets (SPA) for non-API routes
app.get("*", async (c) => {
  const url = new URL(c.req.url)
  
  // If this is an API or RPC route, it should have been handled by earlier handlers
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/rpc/")) {
    return c.notFound()
  }
  
  // For SPA: serve static files or fallback to index.html for client-side routing
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
