import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./src/db/schema",
  out: "./src/db/migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "dev-account",
    databaseId: process.env.CLOUDFLARE_DATABASE_ID || "dev-db", 
    token: process.env.CLOUDFLARE_D1_TOKEN || "dev-token",
  },
})
