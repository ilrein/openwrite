import { and, asc, eq } from "drizzle-orm"
import { type Context, Hono } from "hono"
import { db } from "../db"
import { aiProvider, character, project } from "../db/schema"
import { decryptApiKey } from "../lib/encryption"
import { requireAuth } from "../middleware/auth"

interface Env {
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
  CORS_ORIGIN: string
  ENCRYPTION_KEY: string
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

interface ChatMessage {
  content: string
  role: "user" | "assistant"
}

const MAX_MESSAGES = 40
const MAX_TOTAL_CHARS = 32_000
const MAX_OUTPUT_TOKENS = 2048
const UPSTREAM_ERROR_PREVIEW_CHARS = 300

// Providers that expose an OpenAI-compatible chat completions endpoint
const OPENAI_COMPATIBLE = {
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    // Deliberately a `:free` model — `openrouter/auto` bills credits, so it 402s
    // for anyone who has not topped up. Override per provider in Dashboard → AI.
    defaultModel: "z-ai/glm-5.2:free",
  },
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o-mini",
  },
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.3-70b-versatile",
  },
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    defaultModel: "gemini-2.0-flash",
  },
  cohere: {
    url: "https://api.cohere.ai/compatibility/v1/chat/completions",
    defaultModel: "command-r-08-2024",
  },
} as const

const ANTHROPIC_DEFAULT_MODEL = "claude-haiku-4-5"
const OLLAMA_DEFAULT_URL = "http://localhost:11434"
const OLLAMA_DEFAULT_MODEL = "llama3.2"
const TRAILING_SLASH_PATTERN = /\/$/
const CHAT_COMPLETIONS_SUFFIX = "/chat/completions"
const OPENROUTER_HEADERS = {
  "HTTP-Referer": "https://github.com/ilrein/openwrite",
  "X-Title": "OpenWrite",
}

const BASE_SYSTEM_PROMPT = `You are a thoughtful writing assistant for fiction writers using OpenWrite.
Help with character development, plot structure, pacing, dialogue, world-building, and prose style.
Be specific and constructive. Keep responses concise enough to read in a sidebar — prefer a few focused paragraphs or a short list over an essay.
When the writer asks for prose (a rewrite, a continuation, a description), provide it directly so it can be inserted into their manuscript.`

function validateMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_MESSAGES) {
    return null
  }

  let totalChars = 0
  const messages: ChatMessage[] = []

  for (const item of input) {
    const role = (item as { role?: unknown }).role
    const content = (item as { content?: unknown }).content
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") {
      return null
    }
    totalChars += content.length
    messages.push({ role, content })
  }

  if (totalChars > MAX_TOTAL_CHARS || messages.at(-1)?.role !== "user") {
    return null
  }

  return messages
}

async function buildSystemPrompt(projectId: string | undefined, organizationId: string) {
  if (!projectId) {
    return BASE_SYSTEM_PROMPT
  }

  const projectData = await db
    .select({
      title: project.title,
      type: project.type,
      genre: project.genre,
      description: project.description,
    })
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.organizationId, organizationId)))
    .get()

  if (!projectData) {
    return BASE_SYSTEM_PROMPT
  }

  const characters = await db
    .select({ name: character.name, description: character.description })
    .from(character)
    .where(eq(character.projectId, projectId))
    .orderBy(asc(character.name))
    .limit(20)

  const lines = [BASE_SYSTEM_PROMPT, "", "The writer is working on this project:"]
  lines.push(`- Title: ${projectData.title} (${projectData.type})`)
  if (projectData.genre) {
    lines.push(`- Genre: ${projectData.genre}`)
  }
  if (projectData.description) {
    lines.push(`- Description: ${projectData.description.slice(0, 500)}`)
  }
  if (characters.length > 0) {
    lines.push("- Characters:")
    for (const char of characters) {
      const description = char.description ? ` — ${char.description.slice(0, 200)}` : ""
      lines.push(`  - ${char.name}${description}`)
    }
  }

  return lines.join("\n")
}

interface UpstreamResult {
  error?: string
  message?: string
}

async function readUpstreamError(response: Response): Promise<string> {
  try {
    const text = await response.text()
    return text.slice(0, UPSTREAM_ERROR_PREVIEW_CHARS)
  } catch {
    return "Unknown upstream error"
  }
}

async function callOpenAiCompatible(options: {
  url: string
  apiKey: string | null
  model: string
  system: string
  messages: ChatMessage[]
  extraHeaders?: Record<string, string>
}): Promise<UpstreamResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.extraHeaders,
  }
  if (options.apiKey) {
    headers.Authorization = `Bearer ${options.apiKey}`
  }

  const response = await fetch(options.url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: options.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [{ role: "system", content: options.system }, ...options.messages],
    }),
  })

  if (!response.ok) {
    const detail = await readUpstreamError(response)
    if (response.status === 402) {
      return {
        error: `${detail}\n\nThis model needs provider credits. Choose a different model in Dashboard → AI.`,
      }
    }
    return { error: detail }
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const message = data.choices?.at(0)?.message?.content

  if (!message) {
    return { error: "Provider returned an empty response" }
  }

  return { message }
}

async function callAnthropic(options: {
  apiKey: string
  model: string
  system: string
  messages: ChatMessage[]
}): Promise<UpstreamResult> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": options.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: options.system,
      messages: options.messages,
    }),
  })

  if (!response.ok) {
    return { error: await readUpstreamError(response) }
  }

  const data = (await response.json()) as {
    content?: { type: string; text?: string }[]
  }
  const message = data.content
    ?.filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("")

  if (!message) {
    return { error: "Provider returned an empty response" }
  }

  return { message }
}

function parseProviderConfig(raw: string | null): Record<string, unknown> {
  if (!raw) {
    return {}
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

function readConfigString(config: Record<string, unknown>, key: string): string | undefined {
  const value = config[key]
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

// Model precedence: what the request asked for, then what the user saved on the
// provider, then the built-in default for that provider (if it has one).
function resolveModel(
  requested: string | undefined,
  config: Record<string, unknown>
): string | undefined {
  return requested?.trim() || readConfigString(config, "defaultModel")
}

function normalizeChatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(TRAILING_SLASH_PATTERN, "")
  return trimmed.endsWith(CHAT_COMPLETIONS_SUFFIX)
    ? trimmed
    : `${trimmed}${CHAT_COMPLETIONS_SUFFIX}`
}

interface ProviderTarget {
  extraHeaders?: Record<string, string>
  model: string
  requiresApiKey: boolean
  url: string
}

// Resolve the endpoint and model for any OpenAI-compatible provider, including
// self-hosted (ollama) and arbitrary BYOK gateways (custom).
function resolveProviderTarget(options: {
  provider: string
  providerConfig: Record<string, unknown>
  model: string | undefined
}): ProviderTarget | { error: string } {
  const { provider, providerConfig } = options
  const model = resolveModel(options.model, providerConfig)

  if (provider === "ollama") {
    const baseUrl = readConfigString(providerConfig, "apiUrl") ?? OLLAMA_DEFAULT_URL
    return {
      url: `${baseUrl.replace(TRAILING_SLASH_PATTERN, "")}/v1/chat/completions`,
      model: model ?? OLLAMA_DEFAULT_MODEL,
      requiresApiKey: false,
    }
  }

  if (provider === "custom") {
    const baseUrl = readConfigString(providerConfig, "apiUrl")
    if (!baseUrl) {
      return { error: "This provider has no base URL configured. Set one in Dashboard → AI." }
    }
    if (!model) {
      return { error: "This provider has no model configured. Set one in Dashboard → AI." }
    }
    return { url: normalizeChatCompletionsUrl(baseUrl), model, requiresApiKey: false }
  }

  const endpoint = OPENAI_COMPATIBLE[provider as keyof typeof OPENAI_COMPATIBLE]
  if (!endpoint) {
    return { error: `Provider "${provider}" is not supported for chat yet` }
  }

  return {
    url: endpoint.url,
    model: model ?? endpoint.defaultModel,
    extraHeaders: provider === "openrouter" ? OPENROUTER_HEADERS : undefined,
    requiresApiKey: true,
  }
}

async function dispatchToProvider(options: {
  provider: string
  apiKey: string | null
  providerConfig: Record<string, unknown>
  model: string | undefined
  system: string
  messages: ChatMessage[]
}): Promise<UpstreamResult & { model?: string }> {
  const { provider, apiKey, providerConfig, system, messages } = options

  if (provider === "anthropic") {
    if (!apiKey) {
      return { error: "Anthropic provider has no API key" }
    }
    const model = resolveModel(options.model, providerConfig) ?? ANTHROPIC_DEFAULT_MODEL
    return { ...(await callAnthropic({ apiKey, model, system, messages })), model }
  }

  const target = resolveProviderTarget({ provider, providerConfig, model: options.model })
  if ("error" in target) {
    return { error: target.error }
  }
  if (target.requiresApiKey && !apiKey) {
    return { error: "Provider has no API key configured" }
  }

  return {
    ...(await callOpenAiCompatible({
      url: target.url,
      apiKey,
      model: target.model,
      system,
      messages,
      extraHeaders: target.extraHeaders,
    })),
    model: target.model,
  }
}

interface CompletionFailure {
  code?: "no_provider"
  error: string
  status: 412 | 500 | 502
}

interface CompletionSuccess {
  message: string
  model: string | null
  provider: string
}

type CompletionResult = CompletionSuccess | CompletionFailure

function isCompletionFailure(result: CompletionResult): result is CompletionFailure {
  return "status" in result
}

// Resolve the user's provider, decrypt the key, dispatch, and track usage
async function runCompletionForUser(options: {
  userId: string
  env: Env
  system: string
  messages: ChatMessage[]
  model?: string
}): Promise<CompletionResult> {
  const providers = await db
    .select({
      id: aiProvider.id,
      provider: aiProvider.provider,
      apiKey: aiProvider.apiKey,
      isDefault: aiProvider.isDefault,
      providerConfig: aiProvider.providerConfig,
      currentUsage: aiProvider.currentUsage,
    })
    .from(aiProvider)
    .where(and(eq(aiProvider.userId, options.userId), eq(aiProvider.isActive, true)))
    .orderBy(asc(aiProvider.createdAt))

  const selected = providers.find((p) => p.isDefault) ?? providers.at(0)

  if (!selected) {
    return {
      error: "No AI provider configured. Connect one in Dashboard → AI.",
      code: "no_provider",
      status: 412,
    }
  }

  let apiKey: string | null = null
  if (selected.apiKey) {
    try {
      apiKey = await decryptApiKey(selected.apiKey, options.env)
    } catch {
      return {
        error: "Failed to decrypt the stored API key. Try re-connecting the provider.",
        status: 500,
      }
    }
  }

  try {
    const result = await dispatchToProvider({
      provider: selected.provider,
      apiKey,
      providerConfig: parseProviderConfig(selected.providerConfig),
      model: options.model,
      system: options.system,
      messages: options.messages,
    })

    if (result.error || !result.message) {
      return { error: result.error ?? "Provider returned no content", status: 502 }
    }

    await db
      .update(aiProvider)
      .set({ lastUsedAt: new Date(), currentUsage: (selected.currentUsage ?? 0) + 1 })
      .where(eq(aiProvider.id, selected.id))

    return {
      message: result.message,
      provider: selected.provider,
      model: result.model ?? null,
    }
  } catch {
    return { error: "Failed to reach the AI provider", status: 502 }
  }
}

const aiRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

aiRouter.post("/chat", requireAuth, async (c: AppContext) => {
  const user = c.get("user")
  const activeOrganization = c.get("activeOrganization")

  let body: { messages?: unknown; projectId?: unknown; model?: unknown }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400)
  }

  const messages = validateMessages(body.messages)
  if (!messages) {
    return c.json({ error: "messages must be a non-empty list ending with a user message" }, 400)
  }

  const projectId = typeof body.projectId === "string" ? body.projectId : undefined
  const system = await buildSystemPrompt(projectId, activeOrganization?.id ?? "")

  const result = await runCompletionForUser({
    userId: user.id,
    env: c.env,
    system,
    messages,
    model: typeof body.model === "string" ? body.model : undefined,
  })

  if (isCompletionFailure(result)) {
    return c.json(
      { error: result.error, ...(result.code ? { code: result.code } : {}) },
      result.status
    )
  }

  return c.json(result)
})

export type { ChatMessage, CompletionResult }
export { aiRouter, isCompletionFailure, resolveProviderTarget, runCompletionForUser }
