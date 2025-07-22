import { env } from "cloudflare:workers"
import { RPCHandler } from "@orpc/server/fetch"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { auth } from "./lib/auth"
import { createContext } from "./lib/context"
import { appRouter } from "./routers/index"

interface Env {
  ASSETS: Fetcher
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

app.all("/api/auth/*", (c) => auth.handler(c.req.raw))

// Handle RPC routes
const handler = new RPCHandler(appRouter)
app.use("/rpc/*", async (c, next) => {
  const context = await createContext({ context: c })
  const { matched, response } = await handler.handle(c.req.raw, {
    prefix: "/rpc",
    context,
  })

  if (matched) {
    return c.newResponse(response.body, response)
  }
  await next()
})

// Serve static assets (SPA) - this must be last
app.get("*", async (c) => {
  const url = new URL(c.req.url)
  
  // Skip API routes - they should be handled by earlier route handlers
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/rpc/")) {
    return c.notFound()
  }
  
  // For SPA: serve static files or fallback to index.html for client-side routing
  return c.env.ASSETS.fetch(c.req.raw)
})

export default app
