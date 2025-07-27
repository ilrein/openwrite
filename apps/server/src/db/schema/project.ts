import { sql } from "drizzle-orm"
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { user } from "./auth"
import { organization } from "./organization"

// Define enums for better type safety
export const projectTypeEnum = [
  "novel",
  "trilogy",
  "series",
  "short_story_collection",
  "graphic_novel",
  "screenplay",
] as const
export const projectStatusEnum = [
  "draft",
  "in_progress",
  "completed",
  "published",
  "archived",
] as const
export const visibilityEnum = ["private", "organization", "public"] as const
export const workTypeEnum = [
  "novel",
  "short_story",
  "novella",
  "graphic_novel",
  "screenplay",
] as const
// Role and type enums removed - no longer constraining users to predefined categories
export const plotPointTypeEnum = [
  "inciting_incident",
  "plot_point_1",
  "midpoint",
  "plot_point_2",
  "climax",
  "resolution",
  "custom",
] as const
export const plotPointStatusEnum = ["planned", "in_progress", "completed"] as const
export const loreTypeEnum = [
  "core_rule",
  "history",
  "culture",
  "magic_system",
  "technology",
  "religion",
  "politics",
  "custom",
] as const
export const collaboratorRoleEnum = ["editor", "co_author", "reviewer", "viewer"] as const

// Project table - the main creative project container
export const project = sqliteTable("project", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type", { enum: projectTypeEnum }).notNull().default("novel"),
  genre: text("genre"), // Fantasy, Science Fiction, Romance, etc.
  targetWordCount: integer("target_word_count"),
  currentWordCount: integer("current_word_count").default(0),
  status: text("status", { enum: projectStatusEnum }).notNull().default("draft"),
  visibility: text("visibility", { enum: visibilityEnum }).notNull().default("private"),

  // Ownership and organization
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  // Cover and metadata
  coverImage: text("cover_image"),
  metadata: text("metadata"), // JSON for additional project data (themes, inspiration, series info, etc.)

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),

  // Publishing info
  publishedAt: integer("published_at", { mode: "timestamp" }),
  lastWrittenAt: integer("last_written_at", { mode: "timestamp" }),
})

// Work table - individual novels/stories within a project
export const work = sqliteTable("work", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  workType: text("work_type", { enum: workTypeEnum }).notNull(),
  order: integer("order").notNull().default(1), // For trilogies/series ordering
  targetWordCount: integer("target_word_count"),
  currentWordCount: integer("current_word_count").default(0),
  status: text("status", { enum: projectStatusEnum }).notNull().default("draft"),

  // Cover and metadata specific to this work
  coverImage: text("cover_image"),
  metadata: text("metadata"), // JSON for work-specific data

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  publishedAt: integer("published_at", { mode: "timestamp" }),
  lastWrittenAt: integer("last_written_at", { mode: "timestamp" }),
})

// Chapter table - organizing work content
export const chapter = sqliteTable("chapter", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"), // Markdown/rich text content
  summary: text("summary"), // Brief chapter summary
  wordCount: integer("word_count").default(0),
  order: integer("order").notNull(), // Chapter order within the work
  status: text("status", { enum: projectStatusEnum }).notNull().default("draft"),

  // Relationships
  workId: text("work_id")
    .notNull()
    .references(() => work.id, { onDelete: "cascade" }),

  // Metadata
  notes: text("notes"), // Author notes for this chapter

  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
})

// Character table - character management for projects and works
export const character = sqliteTable(
  "character",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    // role field removed - users can describe character roles freely in description

    // Simplified character - just name, description, and core metadata

    // Relationships - can be shared across project or specific to a work
    projectId: text("project_id").references(() => project.id, { onDelete: "cascade" }), // For shared characters
    workId: text("work_id").references(() => work.id, { onDelete: "cascade" }), // For work-specific characters

    // Visual
    image: text("image"), // Character portrait/reference image

    // Metadata
    metadata: text("metadata"), // JSON for additional character data

    // Timestamps
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (_table) => ({
    // CHECK constraint to ensure character is associated with either project or work (mutually exclusive)
    characterAssociation: check(
      "character_association",
      sql`(project_id IS NULL) IS NOT (work_id IS NULL)`
    ),
  })
)

// Location/Setting table - world-building for projects and works
export const location = sqliteTable(
  "location",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    // type field removed - users can describe location types freely in description

    // Relationships - can be shared across project or specific to a work
    projectId: text("project_id").references(() => project.id, { onDelete: "cascade" }), // For shared locations
    workId: text("work_id").references(() => work.id, { onDelete: "cascade" }), // For work-specific locations
    parentLocationId: text("parent_location_id").$type<string | null>(), // For nested locations

    // Visual and details
    image: text("image"), // Location image/map

    // Metadata
    metadata: text("metadata"), // JSON for additional location data

    // Timestamps
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (_table) => ({
    // CHECK constraint to ensure location is associated with either project or work (mutually exclusive)
    locationAssociation: check(
      "location_association",
      sql`(project_id IS NULL) IS NOT (work_id IS NULL)`
    ),
  })
)

// Plot point/Story beat table - story structure management
export const plotPoint = sqliteTable(
  "plot_point",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    type: text("type", { enum: plotPointTypeEnum }),
    order: integer("order").notNull(), // Order in the story structure

    // Relationships - can be at project level or work level
    projectId: text("project_id").references(() => project.id, { onDelete: "cascade" }), // For project-wide plot points
    workId: text("work_id").references(() => work.id, { onDelete: "cascade" }), // For work-specific plot points
    chapterId: text("chapter_id").references(() => chapter.id, { onDelete: "set null" }), // Optional: link to specific chapter

    // Status
    status: text("status", { enum: plotPointStatusEnum }).notNull().default("planned"),

    // Timestamps
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (_table) => ({
    // CHECK constraint to ensure plot point is associated with either project or work (mutually exclusive)
    plotPointAssociation: check(
      "plot_point_association",
      sql`(project_id IS NULL) IS NOT (work_id IS NULL)`
    ),
  })
)

// Lore/World-building table - knowledge base for story worlds
export const lore = sqliteTable(
  "lore",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    type: text("type", { enum: loreTypeEnum }),

    // Relationships - can be shared across project or specific to a work
    projectId: text("project_id").references(() => project.id, { onDelete: "cascade" }), // For shared lore
    workId: text("work_id").references(() => work.id, { onDelete: "cascade" }), // For work-specific lore

    // Metadata
    metadata: text("metadata"), // JSON for additional lore data

    // Timestamps
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  },
  (_table) => ({
    // CHECK constraint to ensure lore is associated with either project or work (mutually exclusive)
    loreAssociation: check("lore_association", sql`(project_id IS NULL) IS NOT (work_id IS NULL)`),
  })
)

// Project collaborator table - manage who can work on a project
export const projectCollaborator = sqliteTable("project_collaborator", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role", { enum: collaboratorRoleEnum }).notNull(),
  permissions: text("permissions"), // JSON array of specific permissions

  // Timestamps
  invitedAt: integer("invited_at", { mode: "timestamp" }).notNull(),
  acceptedAt: integer("accepted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})

// Writing session table - track writing progress and analytics
export const writingSession = sqliteTable("writing_session", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  workId: text("work_id").references(() => work.id, { onDelete: "set null" }), // Optional: which work was worked on
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  chapterId: text("chapter_id").references(() => chapter.id, { onDelete: "set null" }), // Optional: which chapter was worked on

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
