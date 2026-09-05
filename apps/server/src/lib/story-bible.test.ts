import { describe, expect, it } from "vitest"
import {
  buildBraindumpPrompt,
  buildStylePrompt,
  buildSynopsisPrompt,
  buildTraitPrompt,
  defaultWorldElementTraits,
  isCharacterRole,
  isWorldElementType,
  parseOptions,
  parseTraits,
  type StoryBibleProjectContext,
} from "./story-bible"

const UUID_PATTERN = /[0-9a-f-]{36}/

const project: StoryBibleProjectContext = {
  title: "The Lighthouse",
  genre: "Fantasy",
  styleBible: "Moody, close third person, present tense.",
}

describe("parseTraits", () => {
  it("keeps well-formed traits and fills a missing id", () => {
    const parsed = parseTraits([{ label: "Personality", value: "Brooding" }])
    expect(parsed).toHaveLength(1)
    expect(parsed[0].label).toBe("Personality")
    expect(parsed[0].value).toBe("Brooding")
    expect(parsed[0].id).toMatch(UUID_PATTERN)
  })

  it("accepts a JSON string round-tripped from the database", () => {
    const raw = JSON.stringify([{ id: "t1", label: "Goals", value: "Take the throne" }])
    expect(parseTraits(raw)).toEqual([{ id: "t1", label: "Goals", value: "Take the throne" }])
  })

  it("drops entries without a usable label and tolerates junk", () => {
    expect(parseTraits([{ value: "no label" }, null, "nope", 5])).toEqual([])
    expect(parseTraits("not json")).toEqual([])
    expect(parseTraits(undefined)).toEqual([])
  })
})

describe("defaultWorldElementTraits", () => {
  it("seeds the organization template with Goals/History/Headquarters", () => {
    const labels = defaultWorldElementTraits("organization").map((trait) => trait.label)
    expect(labels).toContain("Goals")
    expect(labels).toContain("History")
    expect(labels).toContain("Headquarters")
    expect(labels).toContain("Other Names")
  })

  it("falls back to the 'other' template for an unknown type", () => {
    // @ts-expect-error deliberately passing an invalid type
    const labels = defaultWorldElementTraits("nonsense").map((trait) => trait.label)
    expect(labels).toEqual(["Details", "History", "Notes", "Other Names"])
  })
})

describe("role / type guards", () => {
  it("recognizes the Sudowrite character roles", () => {
    expect(isCharacterRole("protagonist")).toBe(true)
    expect(isCharacterRole("love_interest")).toBe(true)
    expect(isCharacterRole("sidekick")).toBe(false)
    expect(isCharacterRole(null)).toBe(false)
  })

  it("recognizes worldbuilding element types", () => {
    expect(isWorldElementType("organization")).toBe(true)
    expect(isWorldElementType("other")).toBe(true)
    expect(isWorldElementType("planet")).toBe(false)
  })
})

describe("parseOptions", () => {
  it("parses a clean JSON array of strings", () => {
    expect(parseOptions('["Option A", "Option B"]')).toEqual(["Option A", "Option B"])
  })

  it("extracts the array from markdown fences and prose", () => {
    const raw = 'Sure!\n```json\n["A", "B", "C"]\n```\n'
    expect(parseOptions(raw)).toEqual(["A", "B", "C"])
  })

  it("falls back to the whole message as one option when there is no array", () => {
    expect(parseOptions("Just a single blob of text")).toEqual(["Just a single blob of text"])
  })

  it("returns an empty list for an empty response", () => {
    expect(parseOptions("   ")).toEqual([])
  })

  it("caps runaway responses at 6 options", () => {
    const many = JSON.stringify(Array.from({ length: 20 }, (_, i) => `opt ${i}`))
    expect(parseOptions(many)).toHaveLength(6)
  })
})

describe("prompt builders", () => {
  it("buildTraitPrompt includes project style, known traits, and the target field", () => {
    const prompt = buildTraitPrompt({
      project,
      subjectKind: "character",
      name: "Mara",
      classification: "protagonist",
      description: "The lighthouse keeper.",
      traits: [{ id: "t1", label: "Personality", value: "Stoic" }],
      targetLabel: "Dialogue Style",
      instructions: "Make her terse",
      optionCount: 3,
    })
    expect(prompt).toContain("PROJECT: The Lighthouse (Fantasy)")
    expect(prompt).toContain("STYLE: Moody, close third person")
    expect(prompt).toContain("CHARACTER: Mara — protagonist")
    expect(prompt).toContain("- Personality: Stoic")
    expect(prompt).toContain("ADDITIONAL INSTRUCTIONS: Make her terse")
    expect(prompt).toContain('Write 3 distinct options for the "Dialogue Style"')
  })

  it("buildSynopsisPrompt includes the chapter text and asks for alternatives", () => {
    const prompt = buildSynopsisPrompt({
      project,
      chapterTitle: "Chapter 1",
      chapterText: "Mara lights the lamp and a ship appears.",
      optionCount: 3,
    })
    expect(prompt).toContain("CHAPTER: Chapter 1")
    expect(prompt).toContain("Mara lights the lamp")
    expect(prompt).toContain("Give 3 alternative synopses")
  })

  it("buildSynopsisPrompt notes when the chapter has no text", () => {
    const prompt = buildSynopsisPrompt({
      project,
      chapterTitle: "Chapter 2",
      chapterText: "",
      optionCount: 3,
    })
    expect(prompt).toContain("(this chapter has no text yet)")
  })

  it("buildBraindumpPrompt threads through the synopsis and a focus instruction", () => {
    const prompt = buildBraindumpPrompt({
      project,
      chapterTitle: "Chapter 3",
      chapterSummary: "They row to the wreck.",
      chapterText: "",
      instructions: "sea monsters",
    })
    expect(prompt).toContain("Synopsis so far: They row to the wreck.")
    expect(prompt).toContain("FOCUS ON: sea monsters")
    expect(prompt).toContain("Brain-dump ideas for this chapter now.")
  })

  it("buildStylePrompt asks for a set number of alternative style guides", () => {
    const prompt = buildStylePrompt({
      project,
      description: "A keeper guides ghost ships home.",
      current: null,
      optionCount: 3,
    })
    expect(prompt).toContain("PROJECT: The Lighthouse (Fantasy)")
    expect(prompt).toContain("Premise: A keeper guides ghost ships home.")
    expect(prompt).toContain("Give 3 alternative style guides")
  })
})
