import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { user } from "./auth"
import { organization } from "./organization"

// Novel table - the main creative project
export const novel = sqliteTable("novel", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  genre: text("genre"), // Fantasy, Science Fiction, Romance, etc.
  targetWordCount: integer("target_word_count"),
  currentWordCount: integer("current_word_count").default(0),
  status: text("status").notNull().default("draft"), // "draft", "in_progress", "completed", "published", "archived"
  visibility: text("visibility").notNull().default("private"), // "private", "team", "organization", "public"

  // Ownership and organization
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id),

  // Cover and metadata
  coverImage: text("cover_image"),
  metadata: text("metadata"), // JSON for additional novel data (themes, inspiration, etc.)

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),

  // Publishing info
  publishedAt: integer("published_at", { mode: "timestamp" }),
  lastWrittenAt: integer("last_written_at", { mode: "timestamp" }),
})

// Chapter table - organizing novel content
export const chapter = sqliteTable("chapter", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"), // Markdown/rich text content
  summary: text("summary"), // Brief chapter summary
  wordCount: integer("word_count").default(0),
  order: integer("order").notNull(), // Chapter order within the novel
  status: text("status").notNull().default("draft"), // "draft", "in_progress", "completed", "published"

  // Relationships
  novelId: text("novel_id")
    .notNull()
    .references(() => novel.id),

  // Metadata
  notes: text("notes"), // Author notes for this chapter

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

// Character table - character management for novels
export const character = sqliteTable("character", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  role: text("role"), // "protagonist", "antagonist", "supporting", "minor"

  // Physical and personality traits
  appearance: text("appearance"), // Physical description
  personality: text("personality"), // Personality traits
  backstory: text("backstory"), // Character history
  motivation: text("motivation"), // What drives the character

  // Relationships
  novelId: text("novel_id")
    .notNull()
    .references(() => novel.id),

  // Visual
  image: text("image"), // Character portrait/reference image

  // Metadata
  metadata: text("metadata"), // JSON for additional character data

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

// Location/Setting table - world-building for novels
export const location = sqliteTable("location", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type"), // "city", "country", "building", "room", "fantasy_realm", etc.

  // Relationships
  novelId: text("novel_id")
    .notNull()
    .references(() => novel.id),
  parentLocationId: text("parent_location_id"), // For nested locations (e.g., room within building)

  // Visual and details
  image: text("image"), // Location image/map

  // Metadata
  metadata: text("metadata"), // JSON for additional location data

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

// Plot point/Story beat table - story structure management
export const plotPoint = sqliteTable("plot_point", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type"), // "inciting_incident", "plot_point_1", "midpoint", "plot_point_2", "climax", "resolution", "custom"
  order: integer("order").notNull(), // Order in the story structure

  // Relationships
  novelId: text("novel_id")
    .notNull()
    .references(() => novel.id),
  chapterId: text("chapter_id").references(() => chapter.id), // Optional: link to specific chapter

  // Status
  status: text("status").notNull().default("planned"), // "planned", "in_progress", "completed"

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

// Novel collaborator table - manage who can work on a novel
export const novelCollaborator = sqliteTable("novel_collaborator", {
  id: text("id").primaryKey(),
  novelId: text("novel_id")
    .notNull()
    .references(() => novel.id),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  role: text("role").notNull(), // "editor", "co_author", "reviewer", "viewer"
  permissions: text("permissions"), // JSON array of specific permissions

  // Timestamps
  invitedAt: integer("invited_at", { mode: "timestamp" }).notNull(),
  acceptedAt: integer("accepted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})

// Writing session table - track writing progress and analytics
export const writingSession = sqliteTable("writing_session", {
  id: text("id").primaryKey(),
  novelId: text("novel_id")
    .notNull()
    .references(() => novel.id),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  chapterId: text("chapter_id").references(() => chapter.id), // Optional: which chapter was worked on

  // Session data
  wordsWritten: integer("words_written").default(0),
  timeSpent: integer("time_spent").default(0), // in minutes
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }),

  // Goal tracking
  goalWords: integer("goal_words"), // Words goal for this session
  goalAchieved: integer("goal_achieved", { mode: "boolean" }).default(false),

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})
