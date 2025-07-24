import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import type { aiProvider } from "../db/schema/ai-providers"
import type {
  chapter,
  character,
  location,
  novel,
  novelCollaborator,
  plotPoint,
  writingSession,
} from "../db/schema/novel"

// Infer types from Drizzle schema
export type Novel = InferSelectModel<typeof novel>
export type NewNovel = InferInsertModel<typeof novel>

export type Chapter = InferSelectModel<typeof chapter>
export type NewChapter = InferInsertModel<typeof chapter>

export type Character = InferSelectModel<typeof character>
export type NewCharacter = InferInsertModel<typeof character>

export type Location = InferSelectModel<typeof location>
export type NewLocation = InferInsertModel<typeof location>

export type PlotPoint = InferSelectModel<typeof plotPoint>
export type NewPlotPoint = InferInsertModel<typeof plotPoint>

export type NovelCollaborator = InferSelectModel<typeof novelCollaborator>
export type NewNovelCollaborator = InferInsertModel<typeof novelCollaborator>

export type WritingSession = InferSelectModel<typeof writingSession>
export type NewWritingSession = InferInsertModel<typeof writingSession>

export type AiProvider = InferSelectModel<typeof aiProvider>
export type NewAiProvider = InferInsertModel<typeof aiProvider>
