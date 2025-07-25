import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import type { aiProvider } from "../db/schema/ai-providers"
import type {
  chapter,
  character,
  location,
  plotPoint,
  project,
  projectCollaborator,
  work,
  writingSession,
} from "../db/schema/project"

// Infer types from Drizzle schema
export type Project = InferSelectModel<typeof project>
export type NewProject = InferInsertModel<typeof project>

export type Work = InferSelectModel<typeof work>
export type NewWork = InferInsertModel<typeof work>

export type Chapter = InferSelectModel<typeof chapter>
export type NewChapter = InferInsertModel<typeof chapter>

export type Character = InferSelectModel<typeof character>
export type NewCharacter = InferInsertModel<typeof character>

export type Location = InferSelectModel<typeof location>
export type NewLocation = InferInsertModel<typeof location>

export type PlotPoint = InferSelectModel<typeof plotPoint>
export type NewPlotPoint = InferInsertModel<typeof plotPoint>

export type ProjectCollaborator = InferSelectModel<typeof projectCollaborator>
export type NewProjectCollaborator = InferInsertModel<typeof projectCollaborator>

// Legacy exports for backward compatibility
export type Novel = Project
export type NewNovel = NewProject
export type NovelCollaborator = ProjectCollaborator
export type NewNovelCollaborator = NewProjectCollaborator

export type WritingSession = InferSelectModel<typeof writingSession>
export type NewWritingSession = InferInsertModel<typeof writingSession>

export type AiProvider = InferSelectModel<typeof aiProvider>
export type NewAiProvider = InferInsertModel<typeof aiProvider>
