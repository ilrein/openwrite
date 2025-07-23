import { OpenAPIHono } from "@hono/zod-openapi"
import { Scalar } from "@scalar/hono-api-reference"

interface Env {
  ASSETS: Fetcher
  CORS_ORIGIN: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
}

// Create OpenAPI-enabled Hono app
const openApiApp = new OpenAPIHono<{ Bindings: Env }>()

// Configure OpenAPI documentation
openApiApp.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "OpenWrite API",
    description: "API documentation for OpenWrite - AI-powered writing platform",
  },
  servers: [
    {
      url: "/api",
      description: "OpenWrite API Server",
    },
  ],
})

// Add Scalar API reference UI
openApiApp.get("/docs", Scalar({
  url: "/api/openapi.json",
}))

export { openApiApp }