import { createRoute, z } from "@hono/zod-openapi"
import { getAuth } from "../lib/auth"
import { openApiApp } from "../lib/openapi"

// Define the user info route schema
const userInfoRoute = createRoute({
  method: "get",
  path: "/user/me",
  tags: ["User"],
  summary: "Get Current User",
  description: "Get information about the currently authenticated user",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            authenticated: z.boolean().openapi({
              example: true,
              description: "Whether the user is authenticated",
            }),
            user: z.object({
              id: z.string().openapi({
                example: "user_123",
                description: "Unique user identifier",
              }),
              email: z.string().email().openapi({
                example: "user@example.com",
                description: "User's email address",
              }),
              name: z.string().nullable().openapi({
                example: "John Doe",
                description: "User's display name",
              }),
            }),
          }),
        },
      },
      description: "User information retrieved successfully",
    },
    401: {
      content: {
        "application/json": {
          schema: z.object({
            authenticated: z.boolean().openapi({ example: false }),
            error: z.string().openapi({ example: "Unauthorized" }),
          }),
        },
      },
      description: "User is not authenticated",
    },
  },
})

// Implement the user info route
openApiApp.openapi(userInfoRoute, async (c) => {
  try {
    const auth = getAuth(c.env)
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    })

    if (!session?.user) {
      return c.json(
        {
          authenticated: false,
          error: "Unauthorized",
        },
        401
      )
    }

    return c.json(
      {
        authenticated: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name || null,
        },
      },
      200
    )
  } catch (_error) {
    return c.json(
      {
        authenticated: false,
        error: "Internal server error",
      },
      401
    )
  }
})

export { userInfoRoute }
