import { and, asc, eq } from "drizzle-orm"
import { type Context, Hono } from "hono"
import { db } from "../db"
import { chapter, character, characterGroup, project, work, worldElement } from "../db/schema"
import {
  BRAINDUMP_SYSTEM_PROMPT,
  buildBraindumpPrompt,
  buildStylePrompt,
  buildSynopsisPrompt,
  buildTraitPrompt,
  isWorldElementType,
  OPTIONS_SYSTEM_PROMPT,
  parseOptions,
  parseTraits,
  STYLE_SYSTEM_PROMPT,
  type StoryBibleProjectContext,
  SYNOPSIS_SYSTEM_PROMPT,
  type WorldElementType,
} from "../lib/story-bible"
import { requireAuth, verifyProjectAccess } from "../middleware/auth"
import { isCompletionFailure, runCompletionForUser } from "./ai"

interface Env {
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  CORS_ORIGIN: string
  ENCRYPTION_KEY: string
}

interface Variables {
  activeOrganization: { id: string; name: string; slug: string } | null
  session: { id: string; userId: string }
  user: { id: string; email: string; name: string }
}

type AppContext = Context<{ Bindings: Env; Variables: Variables }>

const OPTION_COUNT = 3
const MAX_NAME_CHARS = 200
const MAX_DESCRIPTION_CHARS = 4000
const MAX_INSTRUCTION_CHARS = 2000

const param = (c: AppContext, name: string): string => c.req.param(name) ?? ""

const now = () => new Date()

const trimField = (value: unknown, max: number): string | undefined => {
  if (typeof value !== "string") {
    return
  }
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : undefined
}

async function loadProjectContext(projectId: string): Promise<StoryBibleProjectContext | null> {
  const row = await db
    .select({ title: project.title, genre: project.genre, styleBible: project.styleBible })
    .from(project)
    .where(eq(project.id, projectId))
    .get()
  return row ?? null
}

interface GenerateResult {
  code?: string
  error?: string
  model?: string | null
  options?: string[]
  provider?: string
  status?: 412 | 500 | 502
  text?: string
}

async function runGeneration(options: {
  c: AppContext
  system: string
  prompt: string
}): Promise<GenerateResult> {
  const result = await runCompletionForUser({
    userId: options.c.get("user").id,
    env: options.c.env,
    system: options.system,
    messages: [{ role: "user", content: options.prompt }],
  })
  if (isCompletionFailure(result)) {
    return { error: result.error, status: result.status, code: result.code }
  }
  return { text: result.message, provider: result.provider, model: result.model }
}

const storyBibleRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

// ---------------------------------------------------------------------------
// Worldbuilding elements

const serializeWorldElement = (row: typeof worldElement.$inferSelect) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  description: row.description,
  traits: parseTraits(row.traits),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

storyBibleRouter.get(
  "/projects/:projectId/world-elements",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const rows = await db
      .select()
      .from(worldElement)
      .where(eq(worldElement.projectId, param(c, "projectId")))
      .orderBy(asc(worldElement.name))
    return c.json({ worldElements: rows.map(serializeWorldElement) })
  }
)

const readJsonBody = async (c: AppContext): Promise<Record<string, unknown> | null> => {
  try {
    const body = await c.req.json()
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {}
  } catch {
    return null
  }
}

const readWorldElementBody = (body: Record<string, unknown>) => {
  const type: WorldElementType | undefined = isWorldElementType(body.type) ? body.type : undefined
  return {
    name: trimField(body.name, MAX_NAME_CHARS),
    type,
    description: trimField(body.description, MAX_DESCRIPTION_CHARS),
    traits: body.traits === undefined ? undefined : parseTraits(body.traits),
  }
}

storyBibleRouter.post(
  "/projects/:projectId/world-elements",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const raw = await readJsonBody(c)
    if (!raw) {
      return c.json({ error: "Invalid JSON body" }, 400)
    }
    const body = readWorldElementBody(raw)
    if (!body.name) {
      return c.json({ error: "Name is required" }, 400)
    }
    const id = crypto.randomUUID()
    const timestamp = now()
    await db.insert(worldElement).values({
      id,
      projectId: param(c, "projectId"),
      name: body.name,
      type: body.type ?? "other",
      description: body.description ?? null,
      traits: JSON.stringify(body.traits ?? []),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    return c.json({ success: true, id }, 201)
  }
)

storyBibleRouter.put(
  "/projects/:projectId/world-elements/:id",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const raw = await readJsonBody(c)
    if (!raw) {
      return c.json({ error: "Invalid JSON body" }, 400)
    }
    const body = readWorldElementBody(raw)
    const updates: Partial<typeof worldElement.$inferInsert> = { updatedAt: now() }
    if (body.name !== undefined) {
      updates.name = body.name
    }
    if (body.type !== undefined) {
      updates.type = body.type
    }
    if (body.description !== undefined) {
      updates.description = body.description
    }
    if (body.traits !== undefined) {
      updates.traits = JSON.stringify(body.traits)
    }
    await db
      .update(worldElement)
      .set(updates)
      .where(
        and(eq(worldElement.id, param(c, "id")), eq(worldElement.projectId, param(c, "projectId")))
      )
    return c.json({ success: true })
  }
)

storyBibleRouter.delete(
  "/projects/:projectId/world-elements/:id",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    await db
      .delete(worldElement)
      .where(
        and(eq(worldElement.id, param(c, "id")), eq(worldElement.projectId, param(c, "projectId")))
      )
    return c.json({ success: true })
  }
)

// ---------------------------------------------------------------------------
// Character groups

const parseMemberIds = (raw: unknown): string[] => {
  let source = raw
  if (typeof source === "string") {
    try {
      source = JSON.parse(source)
    } catch {
      return []
    }
  }
  return Array.isArray(source) ? source.filter((id): id is string => typeof id === "string") : []
}

const serializeGroup = (row: typeof characterGroup.$inferSelect) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  memberIds: parseMemberIds(row.memberIds),
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
})

storyBibleRouter.get(
  "/projects/:projectId/character-groups",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const rows = await db
      .select()
      .from(characterGroup)
      .where(eq(characterGroup.projectId, param(c, "projectId")))
      .orderBy(asc(characterGroup.name))
    return c.json({ characterGroups: rows.map(serializeGroup) })
  }
)

const readGroupBody = (body: Record<string, unknown>) => ({
  name: trimField(body.name, MAX_NAME_CHARS),
  description: trimField(body.description, MAX_DESCRIPTION_CHARS),
  memberIds: body.memberIds === undefined ? undefined : parseMemberIds(body.memberIds),
})

storyBibleRouter.post(
  "/projects/:projectId/character-groups",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const raw = await readJsonBody(c)
    if (!raw) {
      return c.json({ error: "Invalid JSON body" }, 400)
    }
    const body = readGroupBody(raw)
    if (!body.name) {
      return c.json({ error: "Name is required" }, 400)
    }
    const id = crypto.randomUUID()
    const timestamp = now()
    await db.insert(characterGroup).values({
      id,
      projectId: param(c, "projectId"),
      name: body.name,
      description: body.description ?? null,
      memberIds: JSON.stringify(body.memberIds ?? []),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    return c.json({ success: true, id }, 201)
  }
)

storyBibleRouter.put(
  "/projects/:projectId/character-groups/:id",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const raw = await readJsonBody(c)
    if (!raw) {
      return c.json({ error: "Invalid JSON body" }, 400)
    }
    const body = readGroupBody(raw)
    const updates: Partial<typeof characterGroup.$inferInsert> = { updatedAt: now() }
    if (body.name !== undefined) {
      updates.name = body.name
    }
    if (body.description !== undefined) {
      updates.description = body.description
    }
    if (body.memberIds !== undefined) {
      updates.memberIds = JSON.stringify(body.memberIds)
    }
    await db
      .update(characterGroup)
      .set(updates)
      .where(
        and(
          eq(characterGroup.id, param(c, "id")),
          eq(characterGroup.projectId, param(c, "projectId"))
        )
      )
    return c.json({ success: true })
  }
)

storyBibleRouter.delete(
  "/projects/:projectId/character-groups/:id",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    await db
      .delete(characterGroup)
      .where(
        and(
          eq(characterGroup.id, param(c, "id")),
          eq(characterGroup.projectId, param(c, "projectId"))
        )
      )
    return c.json({ success: true })
  }
)

// ---------------------------------------------------------------------------
// AI generation — every endpoint returns { options: string[] } so the UI can
// present the Sudowrite-style pick list, except braindump which is freeform.

const failGeneration = (c: AppContext, result: GenerateResult) =>
  c.json(
    { error: result.error, ...(result.code ? { code: result.code } : {}) },
    result.status ?? 502
  )

interface TraitGenBody {
  instructions?: string
  label: string
}

const readTraitGenBody = async (c: AppContext): Promise<TraitGenBody | null> => {
  const raw = await readJsonBody(c)
  if (!raw) {
    return null
  }
  const label = trimField(raw.label, 120)
  if (!label) {
    return null
  }
  return { label, instructions: trimField(raw.instructions, MAX_INSTRUCTION_CHARS) }
}

storyBibleRouter.post(
  "/projects/:projectId/characters/:id/generate-trait",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const genBody = await readTraitGenBody(c)
    if (!genBody) {
      return c.json({ error: "A trait label is required" }, 400)
    }
    const projectContext = await loadProjectContext(param(c, "projectId"))
    if (!projectContext) {
      return c.json({ error: "Project not found" }, 404)
    }
    const row = await db
      .select({
        name: character.name,
        role: character.role,
        description: character.description,
        traits: character.traits,
      })
      .from(character)
      .where(and(eq(character.id, param(c, "id")), eq(character.projectId, param(c, "projectId"))))
      .get()
    if (!row) {
      return c.json({ error: "Character not found" }, 404)
    }

    const prompt = buildTraitPrompt({
      project: projectContext,
      subjectKind: "character",
      name: row.name,
      classification: row.role,
      description: row.description,
      traits: parseTraits(row.traits),
      targetLabel: genBody.label,
      instructions: genBody.instructions,
      optionCount: OPTION_COUNT,
    })

    const result = await runGeneration({ c, system: OPTIONS_SYSTEM_PROMPT, prompt })
    if (result.error) {
      return failGeneration(c, result)
    }
    return c.json({
      options: parseOptions(result.text ?? ""),
      provider: result.provider,
      model: result.model,
    })
  }
)

storyBibleRouter.post(
  "/projects/:projectId/world-elements/:id/generate-trait",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const genBody = await readTraitGenBody(c)
    if (!genBody) {
      return c.json({ error: "A trait label is required" }, 400)
    }
    const projectContext = await loadProjectContext(param(c, "projectId"))
    if (!projectContext) {
      return c.json({ error: "Project not found" }, 404)
    }
    const row = await db
      .select()
      .from(worldElement)
      .where(
        and(eq(worldElement.id, param(c, "id")), eq(worldElement.projectId, param(c, "projectId")))
      )
      .get()
    if (!row) {
      return c.json({ error: "Worldbuilding element not found" }, 404)
    }

    const prompt = buildTraitPrompt({
      project: projectContext,
      subjectKind: "worldbuilding element",
      name: row.name,
      classification: row.type,
      description: row.description,
      traits: parseTraits(row.traits),
      targetLabel: genBody.label,
      instructions: genBody.instructions,
      optionCount: OPTION_COUNT,
    })

    const result = await runGeneration({ c, system: OPTIONS_SYSTEM_PROMPT, prompt })
    if (result.error) {
      return failGeneration(c, result)
    }
    return c.json({
      options: parseOptions(result.text ?? ""),
      provider: result.provider,
      model: result.model,
    })
  }
)

async function loadChapterInProject(projectId: string, chapterId: string) {
  return await db
    .select({
      id: chapter.id,
      title: chapter.title,
      content: chapter.content,
      summary: chapter.summary,
    })
    .from(chapter)
    .innerJoin(work, eq(chapter.workId, work.id))
    .where(and(eq(chapter.id, chapterId), eq(work.projectId, projectId)))
    .get()
}

const HTML_TAG_PATTERN = /<[^>]+>/g
const WHITESPACE_PATTERN = /\s+/g

const htmlToText = (html: string | null): string =>
  (html ?? "").replace(HTML_TAG_PATTERN, " ").replace(WHITESPACE_PATTERN, " ").trim()

storyBibleRouter.post(
  "/projects/:projectId/chapters/:chapterId/synopsis",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const body = (await c.req.json().catch(() => ({}))) as { instructions?: unknown }
    const projectContext = await loadProjectContext(param(c, "projectId"))
    if (!projectContext) {
      return c.json({ error: "Project not found" }, 404)
    }
    const chapterRow = await loadChapterInProject(param(c, "projectId"), param(c, "chapterId"))
    if (!chapterRow) {
      return c.json({ error: "Chapter not found" }, 404)
    }

    const prompt = buildSynopsisPrompt({
      project: projectContext,
      chapterTitle: chapterRow.title,
      chapterText: htmlToText(chapterRow.content),
      instructions: trimField(body.instructions, MAX_INSTRUCTION_CHARS),
      optionCount: OPTION_COUNT,
    })

    const result = await runGeneration({ c, system: SYNOPSIS_SYSTEM_PROMPT, prompt })
    if (result.error) {
      return failGeneration(c, result)
    }
    return c.json({
      options: parseOptions(result.text ?? ""),
      provider: result.provider,
      model: result.model,
    })
  }
)

storyBibleRouter.post(
  "/projects/:projectId/chapters/:chapterId/braindump",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const body = (await c.req.json().catch(() => ({}))) as { instructions?: unknown }
    const projectContext = await loadProjectContext(param(c, "projectId"))
    if (!projectContext) {
      return c.json({ error: "Project not found" }, 404)
    }
    const chapterRow = await loadChapterInProject(param(c, "projectId"), param(c, "chapterId"))
    if (!chapterRow) {
      return c.json({ error: "Chapter not found" }, 404)
    }

    const prompt = buildBraindumpPrompt({
      project: projectContext,
      chapterTitle: chapterRow.title,
      chapterSummary: chapterRow.summary,
      chapterText: htmlToText(chapterRow.content),
      instructions: trimField(body.instructions, MAX_INSTRUCTION_CHARS),
    })

    const result = await runGeneration({ c, system: BRAINDUMP_SYSTEM_PROMPT, prompt })
    if (result.error) {
      return failGeneration(c, result)
    }
    return c.json({
      text: (result.text ?? "").trim(),
      provider: result.provider,
      model: result.model,
    })
  }
)

storyBibleRouter.post(
  "/projects/:projectId/style/generate",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const body = (await c.req.json().catch(() => ({}))) as { instructions?: unknown }
    const row = await db
      .select({
        title: project.title,
        genre: project.genre,
        description: project.description,
        styleBible: project.styleBible,
      })
      .from(project)
      .where(eq(project.id, param(c, "projectId")))
      .get()
    if (!row) {
      return c.json({ error: "Project not found" }, 404)
    }

    const prompt = buildStylePrompt({
      project: { title: row.title, genre: row.genre, styleBible: row.styleBible },
      description: row.description,
      current: row.styleBible,
      instructions: trimField(body.instructions, MAX_INSTRUCTION_CHARS),
      optionCount: OPTION_COUNT,
    })

    const result = await runGeneration({ c, system: STYLE_SYSTEM_PROMPT, prompt })
    if (result.error) {
      return failGeneration(c, result)
    }
    return c.json({
      options: parseOptions(result.text ?? ""),
      provider: result.provider,
      model: result.model,
    })
  }
)

export { storyBibleRouter }
