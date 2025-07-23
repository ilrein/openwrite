// Simple test to verify API routing works
interface Env {
  ASSETS: Fetcher
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // Handle API routes first
    if (url.pathname.startsWith("/api/")) {
      if (url.pathname === "/api/health") {
        return new Response(JSON.stringify({ status: "ok" }), {
          headers: { "Content-Type": "application/json" },
        })
      }
      return new Response("API route not found", { status: 404 })
    }

    // For non-API routes, serve static assets
    return env.ASSETS.fetch(request)
  },
}
