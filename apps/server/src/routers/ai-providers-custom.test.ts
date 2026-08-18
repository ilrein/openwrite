import { Hono } from "hono"
import { beforeAll, describe, expect, it, vi } from "vitest"

// Real router + middleware + Drizzle against in-memory libsql; only the auth
// provider is stubbed. See integration.test.ts for the same harness.

vi.mock("../db", async () => {
  const mod = await import("../test/test-db")
  return { db: mod.testDb }
})

vi.mock("../lib/auth", () => ({
  getAuth: () => ({
    api: {
      getSession: () =>
        Promise.resolve({
          user: { id: "byok-user", email: "byok@example.com", name: "BYOK Writer" },
          session: { id: "byok-session", userId: "byok-user" },
        }),
    },
  }),
}))

import { eq } from "drizzle-orm"
import { aiProvider, member, organization, user } from "../db/schema"
import { applyMigrations, testDb } from "../test/test-db"
import { apiRouter } from "./index"

const USER_ID = "byok-user"
const ORG_ID = "byok-org"

const app = new Hono()
app.route("/api", apiRouter)

const ENV = {
  BETTER_AUTH_SECRET: "test",
  BETTER_AUTH_URL: "http://localhost",
  CORS_ORIGIN: "http://localhost",
}

function request(path: string, init?: RequestInit) {
  return app.request(
    `http://localhost${path}`,
    { ...init, headers: { "Content-Type": "application/json", ...init?.headers } },
    ENV
  )
}

beforeAll(async () => {
  await applyMigrations()

  const now = new Date()
  await testDb.insert(user).values({
    id: USER_ID,
    name: "BYOK Writer",
    email: "byok@example.com",
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  })
  await testDb.insert(organization).values({
    id: ORG_ID,
    name: "BYOK Org",
    slug: "byok-org",
    createdAt: now,
    updatedAt: now,
  })
  await testDb.insert(member).values({
    id: "byok-member",
    userId: USER_ID,
    organizationId: ORG_ID,
    role: "owner",
    createdAt: now,
  })
})

describe("custom OpenAI-compatible providers", () => {
  it("connects a keyless endpoint with a base URL and model", async () => {
    const response = await request("/api/ai-providers", {
      method: "POST",
      body: JSON.stringify({
        provider: "custom",
        apiKey: "",
        apiUrl: "  http://localhost:1234/v1  ",
        providerConfig: { defaultModel: "local-model" },
      }),
    })

    expect(response.status).toBe(200)

    const saved = await testDb.select().from(aiProvider).where(eq(aiProvider.userId, USER_ID)).get()

    expect(saved?.provider).toBe("custom")
    expect(saved?.keyLabel).toBe("Custom endpoint")
    expect(JSON.parse(saved?.providerConfig ?? "{}")).toEqual({
      defaultModel: "local-model",
      apiUrl: "http://localhost:1234/v1",
    })
  })

  it("trims the stored base URL", async () => {
    const saved = await testDb.select().from(aiProvider).where(eq(aiProvider.userId, USER_ID)).get()
    expect(JSON.parse(saved?.providerConfig ?? "{}").apiUrl).toBe("http://localhost:1234/v1")
  })

  it.each([
    ["blank", ""],
    ["whitespace only", "   "],
    ["no scheme", "api.example.com/v1"],
    ["unsupported scheme", "ftp://api.example.com/v1"],
    ["not a URL at all", "not a url"],
  ])("rejects a %s base URL", async (_label, apiUrl) => {
    const response = await request("/api/ai-providers", {
      method: "POST",
      body: JSON.stringify({
        provider: "custom",
        apiKey: "",
        apiUrl,
        providerConfig: { defaultModel: "local-model" },
      }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("base URL"),
    })
  })

  it("rejects a custom provider with no base URL", async () => {
    const response = await request("/api/ai-providers", {
      method: "POST",
      body: JSON.stringify({
        provider: "custom",
        apiKey: "",
        providerConfig: { defaultModel: "local-model" },
      }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("base URL"),
    })
  })

  it("still requires a key for hosted providers", async () => {
    const response = await request("/api/ai-providers", {
      method: "POST",
      body: JSON.stringify({ provider: "openai", apiKey: "" }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("API key"),
    })
  })
})
