import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { project } from "./project"

// Node types for the unified graph system
export const graphNodeTypeEnum = [
  "story_element", // Acts, chapters, scenes, beats
  "character", // Story characters
  "location", // Settings and places
  "lore", // World-building knowledge
  "plot_thread", // Plot points and story threads
] as const

// Sub-types for story elements
export const storyElementTypeEnum = ["act", "chapter", "scene", "beat", "plot_point"] as const

// Connection types between nodes
export const connectionTypeEnum = [
  "story_flow", // Sequential story progression (chapter -> scene)
  "character_arc", // Character appears in story element
  "setting", // Story element takes place at location
  "plot_thread", // Plot thread spans multiple story elements
  "thematic", // Lore/themes influence story elements
  "reference", // General references between nodes
] as const

// Unified graph nodes table - everything is a node
export const graphNode = sqliteTable("graph_node", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),

  // Node identification
  nodeType: text("node_type", { enum: graphNodeTypeEnum }).notNull(),
  subType: text("sub_type"), // For story_element: act|chapter|scene|beat|plot_point

  // Core content
  title: text("title").notNull(),
  description: text("description"),

  // Visual positioning (for canvas)
  positionX: integer("position_x").default(0),
  positionY: integer("position_y").default(0),

  // Visual properties (JSON)
  visualProperties: text("visual_properties"), // {color, size, icon, shape}

  // Type-specific metadata (JSON)
  metadata: text("metadata"), // Flexible data per node type

  // Content stats
  wordCount: integer("word_count").default(0), // For story elements with text

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

// Text blocks - actual writing content linked to story element nodes
export const textBlock = sqliteTable("text_block", {
  id: text("id").primaryKey(),
  storyNodeId: text("story_node_id")
    .notNull()
    .references(() => graphNode.id, { onDelete: "cascade" }),

  // Content
  content: text("content"), // Rich text/markdown content
  orderIndex: integer("order_index").notNull().default(0), // Multiple blocks per story element
  wordCount: integer("word_count").default(0),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

// Connections between any graph nodes
export const graphConnection = sqliteTable("graph_connection", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),

  // Connection endpoints
  sourceNodeId: text("source_node_id")
    .notNull()
    .references(() => graphNode.id, { onDelete: "cascade" }),
  targetNodeId: text("target_node_id")
    .notNull()
    .references(() => graphNode.id, { onDelete: "cascade" }),

  // Connection properties
  connectionType: text("connection_type", { enum: connectionTypeEnum }).notNull(),
  connectionStrength: integer("connection_strength").default(1), // 1-5 scale

  // Visual properties (JSON)
  visualProperties: text("visual_properties"), // {lineStyle, color, animation}

  // Optional metadata
  metadata: text("metadata"),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

// Export types for TypeScript
export type GraphNodeType = typeof graphNode.$inferSelect
export type NewGraphNode = typeof graphNode.$inferInsert
export type TextBlockType = typeof textBlock.$inferSelect
export type NewTextBlock = typeof textBlock.$inferInsert
export type GraphConnectionType = typeof graphConnection.$inferSelect
export type NewGraphConnection = typeof graphConnection.$inferInsert
