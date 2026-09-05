import { and, asc, eq } from "drizzle-orm"
import { type Context, Hono } from "hono"
import { db } from "../db"
import { chapter, project, work } from "../db/schema"
import { buildReorderUpdates, nextChapterTitle, workTypeForProject } from "../lib/chapters"
import { isStaleContentWrite, secondResolutionNow } from "../lib/optimistic-concurrency"
import { countWordsInHtml } from "../lib/word-count"
import { recordWritingActivity } from "../lib/writing-sessions"
import { requireAuth, verifyProjectAccess } from "../middleware/auth"

interface Env {
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  CORS_ORIGIN: string
}

interface Variables {
  activeOrganization: {
    id: string
    name: string
    slug: string
  } | null
  session: {
    id: string
    userId: string
  }
  user: {
    id: string
    email: string
    name: string
  }
}

type AppContext = Context<{ Bindings: Env; Variables: Variables }>

// Route params on matched routes are always present; Hono's loose typing
// (string | undefined) is narrowed here once instead of at every call site.
function requiredParam(c: AppContext, name: string): string {
  return c.req.param(name) ?? ""
}

// Keep documents well under D1's row size limits
const MAX_CONTENT_BYTES = 1_000_000

const contentRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

async function findPrimaryWork(projectId: string) {
  return await db
    .select({ id: work.id })
    .from(work)
    .where(eq(work.projectId, projectId))
    .orderBy(asc(work.order), asc(work.createdAt))
    .limit(1)
    .get()
}

export async function getOrCreatePrimaryWork(projectId: string): Promise<string | null> {
  const existing = await findPrimaryWork(projectId)
  if (existing) {
    return existing.id
  }

  const projectData = await db
    .select({ title: project.title, type: project.type })
    .from(project)
    .where(eq(project.id, projectId))
    .get()

  if (!projectData) {
    return null
  }

  const workId = crypto.randomUUID()
  const now = new Date()
  await db.insert(work).values({
    id: workId,
    projectId,
    title: projectData.title,
    workType: workTypeForProject(projectData.type),
    order: 1,
    currentWordCount: 0,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  })

  return workId
}

export async function listProjectChapters(projectId: string) {
  return await db
    .select({
      id: chapter.id,
      title: chapter.title,
      summary: chapter.summary,
      braindump: chapter.braindump,
      order: chapter.order,
      status: chapter.status,
      wordCount: chapter.wordCount,
      workId: chapter.workId,
      updatedAt: chapter.updatedAt,
    })
    .from(chapter)
    .innerJoin(work, eq(chapter.workId, work.id))
    .where(eq(work.projectId, projectId))
    .orderBy(asc(chapter.order), asc(chapter.createdAt))
}

async function getChapterInProject(projectId: string, chapterId: string) {
  return await db
    .select({
      id: chapter.id,
      title: chapter.title,
      content: chapter.content,
      wordCount: chapter.wordCount,
      workId: chapter.workId,
      updatedAt: chapter.updatedAt,
    })
    .from(chapter)
    .innerJoin(work, eq(chapter.workId, work.id))
    .where(and(eq(chapter.id, chapterId), eq(work.projectId, projectId)))
    .get()
}

// Project word count is the sum of all chapter word counts across its works
export async function syncProjectWordCount(
  projectId: string,
  markWritten: boolean
): Promise<number> {
  const rows = await db
    .select({ wordCount: chapter.wordCount })
    .from(chapter)
    .innerJoin(work, eq(chapter.workId, work.id))
    .where(eq(work.projectId, projectId))

  const total = rows.reduce((sum, row) => sum + (row.wordCount ?? 0), 0)
  const now = new Date()

  await db
    .update(project)
    .set({
      currentWordCount: total,
      updatedAt: now,
      ...(markWritten ? { lastWrittenAt: now } : {}),
    })
    .where(eq(project.id, projectId))

  return total
}

function validateContentBody(content: unknown): { ok: true; content: string } | { ok: false } {
  if (typeof content !== "string") {
    return { ok: false }
  }
  if (new TextEncoder().encode(content).length > MAX_CONTENT_BYTES) {
    return { ok: false }
  }
  return { ok: true, content }
}

// ---------------------------------------------------------------------------
// Chapter CRUD

// List chapters for a project
contentRouter.get(
  "/projects/:projectId/chapters",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const projectId = requiredParam(c, "projectId")
    const chapters = await listProjectChapters(projectId)

    return c.json({
      chapters: chapters.map((ch) => ({
        ...ch,
        wordCount: ch.wordCount ?? 0,
        updatedAt: ch.updatedAt.toISOString(),
      })),
    })
  }
)

// Create a chapter (lazily creates the project's primary work)
contentRouter.post(
  "/projects/:projectId/chapters",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const projectId = requiredParam(c, "projectId")

    let title: string | undefined
    try {
      const body = await c.req.json()
      title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : undefined
    } catch {
      // Empty body is fine; default title is used
    }

    const workId = await getOrCreatePrimaryWork(projectId)
    if (!workId) {
      return c.json({ error: "Project not found" }, 404)
    }

    const existing = await listProjectChapters(projectId)
    const id = crypto.randomUUID()
    const now = new Date()
    const order = existing.length + 1

    await db.insert(chapter).values({
      id,
      title: title ?? nextChapterTitle(existing.length),
      content: "",
      wordCount: 0,
      order,
      status: "draft",
      workId,
      createdAt: now,
      updatedAt: now,
    })

    return c.json({ success: true, id, order }, 201)
  }
)

// Update chapter metadata (title, summary, status)
contentRouter.put(
  "/projects/:projectId/chapters/:chapterId",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const projectId = requiredParam(c, "projectId")
    const chapterId = requiredParam(c, "chapterId")

    const existing = await getChapterInProject(projectId, chapterId)
    if (!existing) {
      return c.json({ error: "Chapter not found" }, 404)
    }

    const body = await c.req.json()
    const updates: Record<string, string | Date> = { updatedAt: new Date() }

    if (typeof body.title === "string" && body.title.trim()) {
      updates.title = body.title.trim()
    }
    if (typeof body.summary === "string") {
      updates.summary = body.summary
    }
    if (typeof body.braindump === "string") {
      updates.braindump = body.braindump
    }
    if (typeof body.status === "string") {
      updates.status = body.status
    }

    await db.update(chapter).set(updates).where(eq(chapter.id, chapterId))

    return c.json({ success: true })
  }
)

// Reorder chapters — body is the full list of chapter ids in the new order
contentRouter.post(
  "/projects/:projectId/chapters/reorder",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const projectId = requiredParam(c, "projectId")

    const body = await c.req.json()
    if (!Array.isArray(body.chapterIds)) {
      return c.json({ error: "chapterIds must be an array" }, 400)
    }

    const existing = await listProjectChapters(projectId)
    const updates = buildReorderUpdates(
      body.chapterIds,
      existing.map((ch) => ch.id)
    )

    if (!updates) {
      return c.json({ error: "chapterIds must contain exactly the project's chapter ids" }, 400)
    }

    const now = new Date()
    for (const update of updates) {
      await db
        .update(chapter)
        .set({ order: update.order, updatedAt: now })
        .where(eq(chapter.id, update.id))
    }

    return c.json({ success: true })
  }
)

// Delete a chapter
contentRouter.delete(
  "/projects/:projectId/chapters/:chapterId",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const projectId = requiredParam(c, "projectId")
    const chapterId = requiredParam(c, "chapterId")

    const existing = await getChapterInProject(projectId, chapterId)
    if (!existing) {
      return c.json({ error: "Chapter not found" }, 404)
    }

    await db.delete(chapter).where(eq(chapter.id, chapterId))
    await syncProjectWordCount(projectId, false)

    return c.json({ success: true })
  }
)

// ---------------------------------------------------------------------------
// Chapter content

contentRouter.get(
  "/projects/:projectId/chapters/:chapterId/content",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const projectId = requiredParam(c, "projectId")
    const chapterId = requiredParam(c, "chapterId")

    const existing = await getChapterInProject(projectId, chapterId)
    if (!existing) {
      return c.json({ error: "Chapter not found" }, 404)
    }

    return c.json({
      chapterId: existing.id,
      content: existing.content ?? "",
      wordCount: existing.wordCount ?? 0,
      updatedAt: existing.updatedAt.toISOString(),
    })
  }
)

contentRouter.put(
  "/projects/:projectId/chapters/:chapterId/content",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const projectId = requiredParam(c, "projectId")
    const chapterId = requiredParam(c, "chapterId")

    const existing = await getChapterInProject(projectId, chapterId)
    if (!existing) {
      return c.json({ error: "Chapter not found" }, 404)
    }

    let body: { content?: unknown; baseUpdatedAt?: unknown }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    const validated = validateContentBody(body.content)
    if (!validated.ok) {
      return c.json({ error: "Content must be a string under 1MB" }, 400)
    }

    // Reject blind overwrites of a chapter that changed elsewhere since the
    // client loaded it. The client echoes back the `updatedAt` it last saw.
    const baseUpdatedAt = typeof body.baseUpdatedAt === "string" ? body.baseUpdatedAt : undefined
    const currentUpdatedAt = existing.updatedAt.toISOString()
    if (isStaleContentWrite(baseUpdatedAt, currentUpdatedAt)) {
      return c.json(
        {
          error: "This chapter was changed elsewhere since you opened it.",
          code: "stale_content",
          currentUpdatedAt,
          currentWordCount: existing.wordCount ?? 0,
        },
        409
      )
    }

    const wordCount = countWordsInHtml(validated.content)
    const now = secondResolutionNow()

    await db
      .update(chapter)
      .set({ content: validated.content, wordCount, updatedAt: now })
      .where(eq(chapter.id, chapterId))

    const projectWordCount = await syncProjectWordCount(projectId, true)

    // Analytics must never fail a save
    try {
      await recordWritingActivity({
        projectId,
        workId: existing.workId,
        chapterId,
        userId: c.get("user").id,
        wordDelta: wordCount - (existing.wordCount ?? 0),
        now,
      })
    } catch (error) {
      console.error("Failed to record writing session:", error)
    }

    return c.json({
      success: true,
      chapterId,
      wordCount,
      projectWordCount,
      savedAt: now.toISOString(),
    })
  }
)

// ---------------------------------------------------------------------------
// Legacy project-level content endpoints (primary chapter) — kept for
// backwards compatibility with clients that predate chapter support.

async function findPrimaryChapter(projectId: string) {
  const chapters = await listProjectChapters(projectId)
  return chapters.at(0) ?? null
}

contentRouter.get(
  "/projects/:projectId/content",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const projectId = requiredParam(c, "projectId")
    const primary = await findPrimaryChapter(projectId)

    if (!primary) {
      return c.json({ chapterId: null, content: "", wordCount: 0, updatedAt: null })
    }

    const full = await getChapterInProject(projectId, primary.id)

    return c.json({
      chapterId: primary.id,
      content: full?.content ?? "",
      wordCount: primary.wordCount ?? 0,
      updatedAt: primary.updatedAt.toISOString(),
    })
  }
)

contentRouter.put(
  "/projects/:projectId/content",
  requireAuth,
  verifyProjectAccess,
  async (c: AppContext) => {
    const projectId = requiredParam(c, "projectId")

    let body: { content?: unknown }
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400)
    }

    const validated = validateContentBody(body.content)
    if (!validated.ok) {
      return c.json({ error: "Content must be a string under 1MB" }, 400)
    }

    let primary = await findPrimaryChapter(projectId)

    if (!primary) {
      const workId = await getOrCreatePrimaryWork(projectId)
      if (!workId) {
        return c.json({ error: "Project not found" }, 404)
      }
      const id = crypto.randomUUID()
      const now = new Date()
      await db.insert(chapter).values({
        id,
        title: nextChapterTitle(0),
        content: "",
        wordCount: 0,
        order: 1,
        status: "draft",
        workId,
        createdAt: now,
        updatedAt: now,
      })
      primary = (await findPrimaryChapter(projectId)) ?? null
    }

    if (!primary) {
      return c.json({ error: "Failed to create chapter" }, 500)
    }

    const wordCount = countWordsInHtml(validated.content)
    const now = new Date()

    await db
      .update(chapter)
      .set({ content: validated.content, wordCount, updatedAt: now })
      .where(eq(chapter.id, primary.id))

    await syncProjectWordCount(projectId, true)

    // Analytics must never fail a save
    try {
      await recordWritingActivity({
        projectId,
        workId: primary.workId,
        chapterId: primary.id,
        userId: c.get("user").id,
        wordDelta: wordCount - (primary.wordCount ?? 0),
        now,
      })
    } catch (error) {
      console.error("Failed to record writing session:", error)
    }

    return c.json({
      success: true,
      chapterId: primary.id,
      wordCount,
      savedAt: now.toISOString(),
    })
  }
)

export { contentRouter }
