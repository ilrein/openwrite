import { readdirSync } from "node:fs"
import { join } from "node:path"
import { defineConfig } from "drizzle-kit"

// Helper function to find the local D1 database file
function getLocalD1Path(): string | null {
  const wranglerDir = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject"
  try {
    const files = readdirSync(wranglerDir)
    const sqliteFile = files.find(file => file.endsWith('.sqlite'))
    return sqliteFile ? join(wranglerDir, sqliteFile) : null
  } catch {
    return null
  }
}

// Check if we should use local or remote configuration
const localPath = getLocalD1Path()
const useLocal = process.env.NODE_ENV !== "production" && 
                 !process.env.CLOUDFLARE_D1_TOKEN && 
                 !!localPath

// Debug: Uncomment to see configuration decisions
// console.log("🔧 Drizzle Config:", { NODE_ENV: process.env.NODE_ENV, hasToken: !!process.env.CLOUDFLARE_D1_TOKEN, localPath, useLocal })

export default defineConfig({
  schema: "./src/db/schema",
  out: "./src/db/migrations",
  dialect: "sqlite",
  ...(useLocal
    ? {
        // Local development - use SQLite file directly
        dbCredentials: {
          url: getLocalD1Path() ?? ":memory:",
        },
      }
    : {
        // Remote/production - use D1 HTTP API
        driver: "d1-http",
        dbCredentials: {
          accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
          databaseId: process.env.CLOUDFLARE_DATABASE_ID ?? "",
          token: process.env.CLOUDFLARE_D1_TOKEN ?? "",
        },
      }),
})
