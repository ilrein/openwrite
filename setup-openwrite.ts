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

import { execSync } from "child_process"
import { readFileSync, writeFileSync } from "fs"
import { randomBytes } from "crypto"

console.log("🚀 Setting up OpenWrite...\n")

// Check if wrangler is available
try {
  execSync("npx wrangler --version", { stdio: "pipe" })
  console.log("✅ Wrangler CLI found")
} catch (error) {
  console.log("📦 Installing Wrangler CLI...")
  execSync("npm install -g wrangler", { stdio: "inherit" })
}

// Check if user is logged in to Cloudflare
try {
  execSync("npx wrangler whoami", { stdio: "pipe" })
  console.log("✅ Cloudflare authentication found")
} catch (error) {
  console.log("🔐 Please log in to Cloudflare...")
  execSync("npx wrangler login", { stdio: "inherit" })
}

// Create D1 database
console.log("🗄️  Creating D1 database...")
const dbOutput = execSync("npx wrangler d1 create openwrite-app", {
  encoding: "utf-8",
  cwd: "./apps/server",
})

// Extract database ID from output
const dbMatch = dbOutput.match(/"database_id":\s*"([^"]+)"/)
if (!dbMatch) {
  console.error("❌ Failed to extract database ID")
  process.exit(1)
}

const databaseId = dbMatch[1]
console.log("✅ Database created:", databaseId)

// Update wrangler.jsonc
const wranglerPath = "./apps/server/wrangler.jsonc"
let wranglerContent = readFileSync(wranglerPath, "utf-8")

// Replace placeholder values
wranglerContent = wranglerContent
  .replace('"database_name": "YOUR_DB_NAME"', '"database_name": "openwrite-app"')
  .replace('"database_id": "YOUR_DB_ID"', `"database_id": "${databaseId}"`)

writeFileSync(wranglerPath, wranglerContent)
console.log("✅ Updated wrangler.jsonc")

// Generate .dev.vars with secure secrets
const devVarsPath = "./apps/server/.dev.vars"
let devVarsContent = readFileSync(devVarsPath, "utf-8")

// Generate secure secret
const authSecret = randomBytes(32).toString("base64url")

// Update environment variables
devVarsContent = devVarsContent
  .replace("CLOUDFLARE_ACCOUNT_ID=", `CLOUDFLARE_ACCOUNT_ID=auto-detected`)
  .replace("CLOUDFLARE_DATABASE_ID=", `CLOUDFLARE_DATABASE_ID=${databaseId}`)
  .replace("CLOUDFLARE_D1_TOKEN=", `CLOUDFLARE_D1_TOKEN=auto-detected`)
  .replace(
    "BETTER_AUTH_SECRET=ypIbYkLA0NF4SbjHLf3xhxxubzZZWahM",
    `BETTER_AUTH_SECRET=${authSecret}`
  )

writeFileSync(devVarsPath, devVarsContent)
console.log("✅ Generated secure environment variables")

// Run database migrations
console.log("🔄 Running database migrations...")
execSync("bun run db:generate", {
  stdio: "inherit",
  cwd: "./apps/server",
})

execSync(`npx wrangler d1 migrations apply openwrite-app --local`, {
  stdio: "inherit",
  cwd: "./apps/server",
})

console.log("✅ Database migrations applied")

console.log(`
🎉 OpenWrite setup complete!

Next steps:
1. Run: bun dev
2. Open: http://localhost:3001
3. Start writing!

Your database ID: ${databaseId}
`)
