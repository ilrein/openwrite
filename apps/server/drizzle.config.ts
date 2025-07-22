import { readdirSync } from "node:fs"
import { join } from "node:path"
import { defineConfig } from "drizzle-kit"

// Helper function to find the local D1 database file
function getLocalD1Path(): string {
  const wranglerDir = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject"
  try {
    const files = readdirSync(wranglerDir)
    const sqliteFile = files.find(file => file.endsWith('.sqlite'))
    if (!sqliteFile) {
      throw new Error(`No SQLite file found in ${wranglerDir}. Run 'wrangler dev' first to initialize the local database.`)
    }
    return join(wranglerDir, sqliteFile)
  } catch (error) {
    if (error instanceof Error && error.message.includes('No SQLite file found')) {
      throw error
    }
    throw new Error(`Unable to access local D1 database directory: ${wranglerDir}. Run 'wrangler dev' first to initialize the local database.`)
  }
}

// Validate remote credentials
function validateRemoteCredentials(): void {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const databaseId = process.env.CLOUDFLARE_DATABASE_ID
  const token = process.env.CLOUDFLARE_D1_TOKEN

  if (!accountId || !databaseId || !token) {
    const missing = []
    if (!accountId) missing.push('CLOUDFLARE_ACCOUNT_ID')
    if (!databaseId) missing.push('CLOUDFLARE_DATABASE_ID')
    if (!token) missing.push('CLOUDFLARE_D1_TOKEN')
    
    throw new Error(`Missing required environment variables for remote D1 configuration: ${missing.join(', ')}`)
  }
}

// Check if we should use local or remote configuration
let useLocal = false
let localPath: string | null = null

try {
  // First, try to determine if we're in local development
  if (process.env.NODE_ENV !== "production" && !process.env.CLOUDFLARE_D1_TOKEN) {
    localPath = getLocalD1Path()
    useLocal = true
  } else {
    // We're in production or have a D1 token, validate remote credentials
    validateRemoteCredentials()
    useLocal = false
  }
} catch (error) {
  // If local path fails and we don't have remote credentials, this is an error
  if (process.env.NODE_ENV !== "production" && !process.env.CLOUDFLARE_D1_TOKEN) {
    throw error
  }
  
  // If we're trying to use remote but validation failed, this is also an error
  validateRemoteCredentials()
}

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
          url: localPath!,
        },
      }
    : {
        // Remote/production - use D1 HTTP API
        driver: "d1-http",
        dbCredentials: {
          accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
          databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
          token: process.env.CLOUDFLARE_D1_TOKEN!,
        },
      }),
})
