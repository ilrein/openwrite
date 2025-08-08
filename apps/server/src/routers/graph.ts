import { OpenAPIHono } from "@hono/zod-openapi"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "../db"
import { graphConnection, graphNode, textBlock } from "../db/schema"
import { requireAuth, verifyProjectAccess } from "../middleware/auth"

const app = new OpenAPIHono()

// Move regex to top level to avoid performance issues
const WORD_SPLIT_REGEX = /\s+/

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

// Apply auth middleware only to the graph namespace
app.use("/projects/*", requireAuth)
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

// Update graph node position
app.openapi(
  {
    method: "put",
    path: "/projects/{projectId}/graph/nodes/{nodeId}/position",
    request: {
      params: z.object({
        projectId: z.string(),
        nodeId: z.string(),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              positionX: z.number(),
              positionY: z.number(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
            }),
          },
        },
        description: "Node position updated successfully",
      },
    },
  },
  async (c) => {
    const { nodeId } = c.req.valid("param")
    const { positionX, positionY } = c.req.valid("json")

    const now = new Date()

    await db
      .update(graphNode)
      .set({
        positionX,
        positionY,
        updatedAt: now,
      })
      .where(eq(graphNode.id, nodeId))

    return c.json({ success: true })
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
    const nodeData = c.req.valid("json")

    const nodeId = crypto.randomUUID()
    const now = new Date()

    // Map camelCase API fields to snake_case database fields
    await db.insert(graphNode).values({
      id: nodeId,
      projectId,
      nodeType: nodeData.nodeType,
      subType: nodeData.subType,
      title: nodeData.title,
      description: nodeData.description,
      positionX: nodeData.positionX || 0,
      positionY: nodeData.positionY || 0,
      visualProperties: nodeData.visualProperties,
      metadata: nodeData.metadata,
      wordCount: 0, // Default for new nodes
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
    const blockData = c.req.valid("json")

    const blockId = crypto.randomUUID()
    const now = new Date()
    const wordCount = blockData.content ? blockData.content.split(WORD_SPLIT_REGEX).length : 0

    // Map camelCase API fields to proper database fields
    await db.insert(textBlock).values({
      id: blockId,
      storyNodeId: blockData.storyNodeId,
      content: blockData.content,
      orderIndex: blockData.orderIndex || 0,
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
    const connectionData = c.req.valid("json")

    const connectionId = crypto.randomUUID()
    const now = new Date()

    // Map camelCase API fields to proper database fields
    await db.insert(graphConnection).values({
      id: connectionId,
      projectId,
      sourceNodeId: connectionData.sourceNodeId,
      targetNodeId: connectionData.targetNodeId,
      connectionType: connectionData.connectionType,
      connectionStrength: connectionData.connectionStrength || 1,
      visualProperties: connectionData.visualProperties,
      metadata: connectionData.metadata,
      createdAt: now,
      updatedAt: now,
    })

    return c.json({ success: true, id: connectionId }, 201)
  }
)

// Delete a graph node
app.openapi(
  {
    method: "delete",
    path: "/projects/{projectId}/graph/nodes/{nodeId}",
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
              success: z.boolean(),
            }),
          },
        },
        description: "Graph node deleted successfully",
      },
    },
  },
  async (c) => {
    const { nodeId } = c.req.valid("param")

    // Delete associated text blocks first (cascade delete)
    await db.delete(textBlock).where(eq(textBlock.storyNodeId, nodeId))

    // Delete associated connections where this node is source or target
    await db.delete(graphConnection).where(eq(graphConnection.sourceNodeId, nodeId))
    await db.delete(graphConnection).where(eq(graphConnection.targetNodeId, nodeId))

    // Finally delete the node itself
    await db.delete(graphNode).where(eq(graphNode.id, nodeId))

    return c.json({ success: true })
  }
)

// Delete a connection
app.openapi(
  {
    method: "delete",
    path: "/projects/{projectId}/graph/connections/{connectionId}",
    request: {
      params: z.object({
        projectId: z.string(),
        connectionId: z.string(),
      }),
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
            }),
          },
        },
        description: "Graph connection deleted successfully",
      },
    },
  },
  async (c) => {
    const { connectionId } = c.req.valid("param")

    await db.delete(graphConnection).where(eq(graphConnection.id, connectionId))

    return c.json({ success: true })
  }
)

export default app
