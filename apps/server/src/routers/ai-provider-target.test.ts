import { describe, expect, it, vi } from "vitest"

// resolveProviderTarget is pure, but importing the router pulls in the
// D1 binding and the auth middleware, neither of which exist outside Workers.
vi.mock("../db", async () => {
  const mod = await import("../test/test-db")
  return { db: mod.testDb }
})

vi.mock("../lib/auth", () => ({
  getAuth: () => ({ api: { getSession: () => Promise.resolve(null) } }),
}))

import { resolveProviderTarget } from "./ai"

const noConfig = {}

describe("resolveProviderTarget", () => {
  it("uses the request model ahead of the saved one", () => {
    const target = resolveProviderTarget({
      provider: "openrouter",
      providerConfig: { defaultModel: "saved/model" },
      model: "requested/model",
    })
    expect(target).toMatchObject({ model: "requested/model" })
  })

  it("falls back to the model saved on the provider", () => {
    const target = resolveProviderTarget({
      provider: "openai",
      providerConfig: { defaultModel: "gpt-4.1-mini" },
      model: undefined,
    })
    expect(target).toMatchObject({ model: "gpt-4.1-mini" })
  })

  it("ignores a blank saved model", () => {
    const target = resolveProviderTarget({
      provider: "openai",
      providerConfig: { defaultModel: "   " },
      model: undefined,
    })
    expect(target).toMatchObject({ model: "gpt-4o-mini" })
  })

  it("never defaults OpenRouter to a paid routing endpoint", () => {
    const target = resolveProviderTarget({
      provider: "openrouter",
      providerConfig: noConfig,
      model: undefined,
    })
    expect(target).toMatchObject({ model: expect.stringMatching(/:free$/) })
    expect(target).not.toMatchObject({ model: "openrouter/auto" })
  })

  it("sends attribution headers only for OpenRouter", () => {
    expect(
      resolveProviderTarget({ provider: "openrouter", providerConfig: noConfig, model: undefined })
    ).toMatchObject({ extraHeaders: { "X-Title": "OpenWrite" } })
    expect(
      resolveProviderTarget({ provider: "groq", providerConfig: noConfig, model: undefined })
    ).toMatchObject({ extraHeaders: undefined })
  })

  describe("custom endpoints", () => {
    it("appends the chat completions path to a base URL", () => {
      const target = resolveProviderTarget({
        provider: "custom",
        providerConfig: { apiUrl: "https://api.example.com/v1", defaultModel: "my-model" },
        model: undefined,
      })
      expect(target).toMatchObject({
        url: "https://api.example.com/v1/chat/completions",
        model: "my-model",
        requiresApiKey: false,
      })
    })

    it("does not double up when the URL already ends in the chat path", () => {
      const target = resolveProviderTarget({
        provider: "custom",
        providerConfig: {
          apiUrl: "https://api.example.com/v1/chat/completions/",
          defaultModel: "my-model",
        },
        model: undefined,
      })
      expect(target).toMatchObject({ url: "https://api.example.com/v1/chat/completions" })
    })

    it("errors when the base URL is missing", () => {
      const target = resolveProviderTarget({
        provider: "custom",
        providerConfig: { defaultModel: "my-model" },
        model: undefined,
      })
      expect(target).toMatchObject({ error: expect.stringContaining("base URL") })
    })

    it("errors when no model is configured", () => {
      const target = resolveProviderTarget({
        provider: "custom",
        providerConfig: { apiUrl: "https://api.example.com/v1" },
        model: undefined,
      })
      expect(target).toMatchObject({ error: expect.stringContaining("model") })
    })
  })

  describe("ollama", () => {
    it("honours a saved model", () => {
      const target = resolveProviderTarget({
        provider: "ollama",
        providerConfig: { apiUrl: "http://localhost:11434/", defaultModel: "mistral" },
        model: undefined,
      })
      expect(target).toMatchObject({
        url: "http://localhost:11434/v1/chat/completions",
        model: "mistral",
        requiresApiKey: false,
      })
    })

    it("falls back to the built-in host and model", () => {
      const target = resolveProviderTarget({
        provider: "ollama",
        providerConfig: noConfig,
        model: undefined,
      })
      expect(target).toMatchObject({
        url: "http://localhost:11434/v1/chat/completions",
        model: "llama3.2",
      })
    })
  })

  it("rejects an unknown provider", () => {
    const target = resolveProviderTarget({
      provider: "nope",
      providerConfig: noConfig,
      model: undefined,
    })
    expect(target).toMatchObject({ error: expect.stringContaining("not supported") })
  })
})
