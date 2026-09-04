/**
 * Story Bible — pure logic for the Sudowrite-style character / worldbuilding
 * cards, per-chapter synopsis & braindump, and the project style guide.
 *
 * Trait templates, prompt building, and response parsing live here; the I/O
 * (DB reads, provider calls) happens in routers/story-bible.ts.
 */

export interface Trait {
  id: string
  label: string
  value: string
}

// ---------------------------------------------------------------------------
// Dropdown + default-trait templates (the labels Sudowrite seeds on new cards)

export const CHARACTER_ROLE_LABELS = {
  protagonist: "Protagonist",
  antagonist: "Antagonist",
  supporting: "Supporting Character",
  minor: "Minor Character",
  love_interest: "Love Interest",
} as const

export type CharacterRole = keyof typeof CHARACTER_ROLE_LABELS

export const CHARACTER_DEFAULT_TRAIT_LABELS = [
  "Personality",
  "Background",
  "Physical Description",
  "Dialogue Style",
  "Skills & Resources",
  "Relationship to Protagonist",
  "Role in Story",
  "Other Names",
  "Pronouns",
] as const

export const WORLD_ELEMENT_TYPE_LABELS = {
  setting: "Setting",
  item: "Item",
  organization: "Organization",
  culture: "Culture",
  magic_system: "Magic System",
  technology: "Technology",
  religion: "Religion",
  history: "History",
  language: "Language",
  creature: "Creature",
  other: "Other",
} as const

export type WorldElementType = keyof typeof WORLD_ELEMENT_TYPE_LABELS

// Each worldbuilding type seeds a different set of default traits, mirroring
// Sudowrite's per-template trait sets.
export const WORLD_ELEMENT_DEFAULT_TRAIT_LABELS: Record<WorldElementType, readonly string[]> = {
  setting: ["Geography", "History", "Atmosphere", "Notable Features", "Other Names"],
  item: ["Appearance", "History", "Powers & Properties", "Who owns it", "Other Names"],
  organization: ["Goals", "History", "Headquarters", "Notable Members", "Other Names"],
  culture: ["Values & Beliefs", "Customs & Traditions", "History", "Language", "Other Names"],
  magic_system: ["Rules & Limits", "Source", "Cost", "Who can use it", "History"],
  technology: ["How it works", "Limitations", "Who controls it", "History", "Other Names"],
  religion: ["Beliefs", "Practices & Rituals", "Hierarchy", "History", "Other Names"],
  history: ["Timeline", "Key Figures", "Causes", "Consequences", "Other Names"],
  language: ["Speakers", "Sample Phrases", "Writing System", "History"],
  creature: ["Physical Description", "Behavior", "Habitat", "Abilities", "Other Names"],
  other: ["Details", "History", "Notes", "Other Names"],
}

const MAX_TRAIT_LABEL_CHARS = 80
const MAX_TRAIT_VALUE_CHARS = 4000

const randomId = (): string => crypto.randomUUID()

const makeTrait = (label: string): Trait => ({ id: randomId(), label, value: "" })

export const defaultCharacterTraits = (): Trait[] =>
  CHARACTER_DEFAULT_TRAIT_LABELS.map((label) => makeTrait(label))

export const defaultWorldElementTraits = (type: WorldElementType): Trait[] =>
  (WORLD_ELEMENT_DEFAULT_TRAIT_LABELS[type] ?? WORLD_ELEMENT_DEFAULT_TRAIT_LABELS.other).map(
    (label) => makeTrait(label)
  )

export const isCharacterRole = (value: unknown): value is CharacterRole =>
  typeof value === "string" && value in CHARACTER_ROLE_LABELS

export const isWorldElementType = (value: unknown): value is WorldElementType =>
  typeof value === "string" && value in WORLD_ELEMENT_TYPE_LABELS

/**
 * Normalize an untrusted `traits` payload (array from the client, or a JSON
 * string round-tripped from the DB) into a clean Trait[]. Anything malformed
 * collapses to an empty list rather than throwing.
 */
export function parseTraits(raw: unknown): Trait[] {
  let source = raw
  if (typeof source === "string") {
    try {
      source = JSON.parse(source)
    } catch {
      return []
    }
  }
  if (!Array.isArray(source)) {
    return []
  }

  const traits: Trait[] = []
  for (const item of source) {
    if (typeof item !== "object" || item === null) {
      continue
    }
    const { id, label, value } = item as Record<string, unknown>
    if (typeof label !== "string" || !label.trim()) {
      continue
    }
    traits.push({
      id: typeof id === "string" && id ? id : randomId(),
      label: label.trim().slice(0, MAX_TRAIT_LABEL_CHARS),
      value: typeof value === "string" ? value.slice(0, MAX_TRAIT_VALUE_CHARS) : "",
    })
  }
  return traits
}

// ---------------------------------------------------------------------------
// Prompt building

const MAX_CONTEXT_CHARS = 400
const MAX_INSTRUCTION_CHARS = 1000
const MAX_CHAPTER_CHARS = 12_000

export interface StoryBibleProjectContext {
  genre: string | null
  styleBible: string | null
  title: string
}

const projectHeaderLines = (project: StoryBibleProjectContext): string[] => {
  const lines = [`PROJECT: ${project.title}${project.genre ? ` (${project.genre})` : ""}`]
  if (project.styleBible?.trim()) {
    lines.push(`STYLE: ${project.styleBible.trim().slice(0, MAX_CONTEXT_CHARS)}`)
  }
  return lines
}

const knownTraitLines = (traits: Trait[]): string[] => {
  const filled = traits.filter((trait) => trait.value.trim())
  if (filled.length === 0) {
    return []
  }
  const lines = ["WHAT WE ALREADY KNOW:"]
  for (const trait of filled) {
    lines.push(`- ${trait.label}: ${trait.value.trim().slice(0, MAX_CONTEXT_CHARS)}`)
  }
  return lines
}

export const OPTIONS_SYSTEM_PROMPT = `You are a story development assistant for OpenWrite.
You are given a story element and one specific field to flesh out.
Produce DISTINCT alternative takes on that field — different enough to be real choices, all consistent with what is already known.
Respond with ONLY a JSON array of strings. No prose, no markdown fences. Each string is one self-contained option (1-4 sentences).`

export interface TraitPromptOptions {
  classification: string | null
  description: string | null
  instructions?: string
  name: string
  optionCount: number
  project: StoryBibleProjectContext
  subjectKind: "character" | "worldbuilding element"
  targetLabel: string
  traits: Trait[]
}

export function buildTraitPrompt(options: TraitPromptOptions): string {
  const lines = projectHeaderLines(options.project)
  lines.push("")
  lines.push(
    `${options.subjectKind.toUpperCase()}: ${options.name}${
      options.classification ? ` — ${options.classification}` : ""
    }`
  )
  if (options.description?.trim()) {
    lines.push(`Overview: ${options.description.trim().slice(0, MAX_CONTEXT_CHARS)}`)
  }
  lines.push(...knownTraitLines(options.traits))
  if (options.instructions?.trim()) {
    lines.push("")
    lines.push(
      `ADDITIONAL INSTRUCTIONS: ${options.instructions.trim().slice(0, MAX_INSTRUCTION_CHARS)}`
    )
  }
  lines.push("")
  lines.push(
    `Write ${options.optionCount} distinct options for the "${options.targetLabel}" of this ${options.subjectKind}. ` +
      "Output ONLY the JSON array of strings."
  )
  return lines.join("\n")
}

export const SYNOPSIS_SYSTEM_PROMPT = `You are a developmental editor for OpenWrite.
Summarize the chapter text into a tight synopsis: the key events, the turn, and where it leaves off.
Respond with ONLY a JSON array of strings. No markdown. Each string is one alternative synopsis of 2-4 sentences.`

export interface SynopsisPromptOptions {
  chapterText: string
  chapterTitle: string
  instructions?: string
  optionCount: number
  project: StoryBibleProjectContext
}

export function buildSynopsisPrompt(options: SynopsisPromptOptions): string {
  const lines = projectHeaderLines(options.project)
  lines.push("")
  lines.push(`CHAPTER: ${options.chapterTitle}`)
  lines.push("")
  lines.push("CHAPTER TEXT:")
  lines.push(options.chapterText.slice(0, MAX_CHAPTER_CHARS) || "(this chapter has no text yet)")
  if (options.instructions?.trim()) {
    lines.push("")
    lines.push(
      `ADDITIONAL INSTRUCTIONS: ${options.instructions.trim().slice(0, MAX_INSTRUCTION_CHARS)}`
    )
  }
  lines.push("")
  lines.push(
    `Give ${options.optionCount} alternative synopses. Output ONLY the JSON array of strings.`
  )
  return lines.join("\n")
}

export const BRAINDUMP_SYSTEM_PROMPT = `You are a brainstorming partner for a novelist using OpenWrite.
Riff freely on what could happen in this chapter: raw ideas, images, "what ifs", complications, sensory details, snatches of dialogue. Quantity over polish, no structure required.
Return plain text — a few short paragraphs or a loose bulleted dump. No preamble, no headings.`

export interface BraindumpPromptOptions {
  chapterSummary: string | null
  chapterText: string
  chapterTitle: string
  instructions?: string
  project: StoryBibleProjectContext
}

export function buildBraindumpPrompt(options: BraindumpPromptOptions): string {
  const lines = projectHeaderLines(options.project)
  lines.push("")
  lines.push(`CHAPTER: ${options.chapterTitle}`)
  if (options.chapterSummary?.trim()) {
    lines.push(`Synopsis so far: ${options.chapterSummary.trim().slice(0, MAX_CONTEXT_CHARS)}`)
  }
  const text = options.chapterText.trim()
  if (text) {
    lines.push("")
    lines.push("WHAT'S WRITTEN SO FAR:")
    lines.push(text.slice(0, MAX_CHAPTER_CHARS))
  }
  if (options.instructions?.trim()) {
    lines.push("")
    lines.push(`FOCUS ON: ${options.instructions.trim().slice(0, MAX_INSTRUCTION_CHARS)}`)
  }
  lines.push("")
  lines.push("Brain-dump ideas for this chapter now.")
  return lines.join("\n")
}

export const STYLE_SYSTEM_PROMPT = `You are a prose-style analyst for OpenWrite.
Draft a "style" guide for a novel: narration style, tone, sentence rhythm, diction, POV and tense, and 2-3 comparable authors or titles.
Respond with ONLY a JSON array of strings. No markdown. Each string is one alternative style guide of one short paragraph.`

export interface StylePromptOptions {
  current: string | null
  description: string | null
  instructions?: string
  optionCount: number
  project: StoryBibleProjectContext
}

export function buildStylePrompt(options: StylePromptOptions): string {
  const lines = [
    `PROJECT: ${options.project.title}${options.project.genre ? ` (${options.project.genre})` : ""}`,
  ]
  if (options.description?.trim()) {
    lines.push(`Premise: ${options.description.trim().slice(0, MAX_CONTEXT_CHARS)}`)
  }
  if (options.current?.trim()) {
    lines.push(`Current style notes: ${options.current.trim().slice(0, MAX_CONTEXT_CHARS)}`)
  }
  if (options.instructions?.trim()) {
    lines.push(
      `ADDITIONAL INSTRUCTIONS: ${options.instructions.trim().slice(0, MAX_INSTRUCTION_CHARS)}`
    )
  }
  lines.push("")
  lines.push(
    `Give ${options.optionCount} alternative style guides. Output ONLY the JSON array of strings.`
  )
  return lines.join("\n")
}

// ---------------------------------------------------------------------------
// Response parsing

const MAX_OPTIONS = 6
const MAX_OPTION_CHARS = 2000
const FENCE_PATTERN = /```(?:json)?/gi

/**
 * Pull a JSON array of strings out of a model response that may include stray
 * prose or markdown fences. Falls back to the whole cleaned message as a single
 * option so the caller always has something to show.
 */
export function parseOptions(raw: string): string[] {
  const cleaned = raw.replace(FENCE_PATTERN, "").trim()
  const start = cleaned.indexOf("[")
  const end = cleaned.lastIndexOf("]")

  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1)) as unknown
      if (Array.isArray(parsed)) {
        const options = parsed
          .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
          .map((item) => item.trim().slice(0, MAX_OPTION_CHARS))
          .slice(0, MAX_OPTIONS)
        if (options.length > 0) {
          return options
        }
      }
    } catch {
      // fall through to the single-option fallback
    }
  }

  return cleaned ? [cleaned.slice(0, MAX_OPTION_CHARS)] : []
}
