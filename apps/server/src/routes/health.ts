import { createRoute, z } from "@hono/zod-openapi"
import { openApiApp } from "../lib/openapi"

// Define the health check route schema
const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["System"],
  summary: "Health Check",
  description: "Check if the API server is running and healthy",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.string().openapi({
              example: "ok",
              description: "Health status of the API",
            }),
            timestamp: z.string().openapi({
              example: "2024-01-01T00:00:00Z",
              description: "Current server timestamp",
            }),
            version: z.string().openapi({
              example: "1.0.0",
              description: "API version",
            }),
          }),
        },
      },
      description: "Server is healthy",
    },
  },
})

// Implement the health check route
openApiApp.openapi(healthRoute, (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })
})

export { healthRoute }
