import { OpenAPIHono } from "@hono/zod-openapi"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db"
import { graphConnection, graphNode, textBlock } from "../db/schema"
import { requireAuth, verifyProjectAccess } from "../middleware/auth"

const app = new OpenAPIHono()

// Zod schemas for validation
const CreateGraphNodeSchema = z.object({
  nodeType: z.enum(["story_element", "character", "location", "lore", "plot_thread"]),
  subType: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  positionX: z.number().default(0),
  positionY: z.number().default(0),
  visualProperties: z.string().optional(), // JSON string
  metadata: z.string().optional(), // JSON string
})

const CreateTextBlockSchema = z.object({
  storyNodeId: z.string(),
  content: z.string().optional(),
  orderIndex: z.number().default(0),
})

const CreateConnectionSchema = z.object({
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  connectionType: z.enum([
    "story_flow",
    "character_arc",
    "setting",
    "plot_thread",
    "thematic",
    "reference",
  ]),
  connectionStrength: z.number().min(1).max(5).default(1),
  visualProperties: z.string().optional(), // JSON string
  metadata: z.string().optional(),
})

// Apply auth middleware to all routes
app.use("*", requireAuth)
// Verify project access for all project-specific routes
app.use("/projects/:projectId/*", verifyProjectAccess)

// Get all graph nodes for a project
app.openapi(
  {
    method: "get",
    path: "/projects/{projectId}/graph/nodes",
    request: {
      params: z.object({
        projectId: z.string(),
      }),
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.object({
              nodes: z.array(z.any()), // We'll improve this typing later
            }),
          },
        },
        description: "Graph nodes retrieved successfully",
      },
    },
  },
  async (c) => {
    const { projectId } = c.req.valid("param")

    const nodes = await db.select().from(graphNode).where(eq(graphNode.projectId, projectId))

    return c.json({ nodes })
  }
)

// Create a new graph node
app.openapi(
  {
    method: "post",
    path: "/projects/{projectId}/graph/nodes",
    request: {
      params: z.object({
        projectId: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: CreateGraphNodeSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              id: z.string(),
            }),
          },
        },
        description: "Graph node created successfully",
      },
    },
  },
  async (c) => {
    const { projectId } = c.req.valid("param")
    const nodeData = c.req.valid("body")

    const nodeId = crypto.randomUUID()
    const now = new Date()

    await db.insert(graphNode).values({
      id: nodeId,
      projectId,
      ...nodeData,
      createdAt: now,
      updatedAt: now,
    })

    return c.json({ success: true, id: nodeId }, 201)
  }
)

// Get all text blocks for a story node
app.openapi(
  {
    method: "get",
    path: "/projects/{projectId}/graph/nodes/{nodeId}/text-blocks",
    request: {
      params: z.object({
        projectId: z.string(),
        nodeId: z.string(),
      }),
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.object({
              textBlocks: z.array(z.any()),
            }),
          },
        },
        description: "Text blocks retrieved successfully",
      },
    },
  },
  async (c) => {
    const { nodeId } = c.req.valid("param")

    const blocks = await db.select().from(textBlock).where(eq(textBlock.storyNodeId, nodeId))

    return c.json({ textBlocks: blocks })
  }
)

// Create a text block for a story node
app.openapi(
  {
    method: "post",
    path: "/projects/{projectId}/graph/nodes/{nodeId}/text-blocks",
    request: {
      params: z.object({
        projectId: z.string(),
        nodeId: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: CreateTextBlockSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              id: z.string(),
            }),
          },
        },
        description: "Text block created successfully",
      },
    },
  },
  async (c) => {
    const blockData = c.req.valid("body")

    const blockId = crypto.randomUUID()
    const now = new Date()
    const wordCount = blockData.content ? blockData.content.split(/\s+/).length : 0

    await db.insert(textBlock).values({
      id: blockId,
      ...blockData,
      wordCount,
      createdAt: now,
      updatedAt: now,
    })

    return c.json({ success: true, id: blockId }, 201)
  }
)

// Get all connections for a project
app.openapi(
  {
    method: "get",
    path: "/projects/{projectId}/graph/connections",
    request: {
      params: z.object({
        projectId: z.string(),
      }),
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.object({
              connections: z.array(z.any()),
            }),
          },
        },
        description: "Graph connections retrieved successfully",
      },
    },
  },
  async (c) => {
    const { projectId } = c.req.valid("param")

    const connections = await db
      .select()
      .from(graphConnection)
      .where(eq(graphConnection.projectId, projectId))

    return c.json({ connections })
  }
)

// Create a connection between nodes
app.openapi(
  {
    method: "post",
    path: "/projects/{projectId}/graph/connections",
    request: {
      params: z.object({
        projectId: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: CreateConnectionSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              id: z.string(),
            }),
          },
        },
        description: "Graph connection created successfully",
      },
    },
  },
  async (c) => {
    const { projectId } = c.req.valid("param")
    const connectionData = c.req.valid("body")

    const connectionId = crypto.randomUUID()
    const now = new Date()

    await db.insert(graphConnection).values({
      id: connectionId,
      projectId,
      ...connectionData,
      createdAt: now,
      updatedAt: now,
    })

    return c.json({ success: true, id: connectionId }, 201)
  }
)

export default app
