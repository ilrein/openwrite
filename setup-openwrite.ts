#!/usr/bin/env node

/**
 * OpenWrite Automated Setup Script
 *
 * This script automates the entire Cloudflare D1 setup process:
 * 1. Checks if wrangler is installed
 * 2. Handles Cloudflare login
 * 3. Creates D1 database
 * 4. Updates wrangler.jsonc with database details
 * 5. Runs migrations
 * 6. Generates .dev.vars with secrets
 * 7. Starts the development server
 */

import { execSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"

// Check if wrangler is available
try {
  execSync("npx wrangler --version", { stdio: "pipe" })
} catch (_error) {
  execSync("npm install -g wrangler", { stdio: "inherit" })
}

// Check if user is logged in to Cloudflare
try {
  execSync("npx wrangler whoami", { stdio: "pipe" })
} catch (_error) {
  execSync("npx wrangler login", { stdio: "inherit" })
}
const dbOutput = execSync("npx wrangler d1 create openwrite-app", {
  encoding: "utf-8",
  cwd: "./apps/server",
})

// Extract database ID from output
const dbMatch = dbOutput.match(/"database_id":\s*"([^"]+)"/)
if (!dbMatch) {
  process.exit(1)
}

const databaseId = dbMatch[1]

// Validate the extracted database ID
if (!databaseId || databaseId.length < 10) {
  process.exit(1)
}

// Update wrangler.jsonc
const wranglerPath = "./apps/server/wrangler.jsonc"
let wranglerContent = readFileSync(wranglerPath, "utf-8")

// Replace placeholder values
wranglerContent = wranglerContent
  .replace('"database_name": "YOUR_DB_NAME"', '"database_name": "openwrite-app"')
  .replace('"database_id": "YOUR_DB_ID"', `"database_id": "${databaseId}"`)

writeFileSync(wranglerPath, wranglerContent)

// Generate .dev.vars with secure secrets
const devVarsPath = "./apps/server/.dev.vars"
let devVarsContent = readFileSync(devVarsPath, "utf-8")

// Generate secure secret
const authSecret = randomBytes(32).toString("base64url")

// Update environment variables
devVarsContent = devVarsContent
  .replace("CLOUDFLARE_ACCOUNT_ID=", "CLOUDFLARE_ACCOUNT_ID=auto-detected")
  .replace("CLOUDFLARE_DATABASE_ID=", `CLOUDFLARE_DATABASE_ID=${databaseId}`)
  .replace("CLOUDFLARE_D1_TOKEN=", "CLOUDFLARE_D1_TOKEN=auto-detected")
  .replace(/BETTER_AUTH_SECRET=.*/, `BETTER_AUTH_SECRET=${authSecret}`)

writeFileSync(devVarsPath, devVarsContent)
try {
  execSync("bun run db:generate", {
    stdio: "inherit",
    cwd: "./apps/server",
  })
  execSync("npx wrangler d1 migrations apply openwrite-app --local", {
    stdio: "inherit",
    cwd: "./apps/server",
  })
} catch (_error) {
  process.exit(1)
}
