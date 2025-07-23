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

// Export the fetch handler following Cloudflare docs pattern
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Handle API routes first - this ensures they take priority over static assets
    if (url.pathname.startsWith("/api/")) {
      const honoApp = new Hono<{ Bindings: Env }>()

      honoApp.use(logger())
      honoApp.use(
        "/*",
        cors({
          origin: env.CORS_ORIGIN ?? "*",
          allowMethods: ["GET", "POST", "OPTIONS"],
          allowHeaders: ["Content-Type", "Authorization"],
          credentials: true,
        })
      )

      // API routes
      honoApp.get("/api/health", (c) => c.json({ status: "ok" }))

      honoApp.get("/api/auth/*", async (c) => {
        const auth = getAuth(c.env)
        return auth.handler(c.req.raw)
      })

      honoApp.post("/api/auth/*", async (c) => {
        const auth = getAuth(c.env)
        return auth.handler(c.req.raw)
      })

      honoApp.get("/api/session", async (c) => {
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

      honoApp.get("/api/private-data", async (c) => {
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

      return honoApp.fetch(request, env)
    }

    // For non-API routes, serve static assets
    return env.ASSETS.fetch(request)
  },
}
