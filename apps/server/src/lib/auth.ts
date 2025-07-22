import { env } from "cloudflare:workers"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../db"
import * as schema from "../db/schema/auth"

// Validate required environment variables
function validateAuthEnvVars() {
  const requiredVars = [
    { name: "CORS_ORIGIN", value: env.CORS_ORIGIN },
    { name: "BETTER_AUTH_SECRET", value: env.BETTER_AUTH_SECRET },
    { name: "BETTER_AUTH_URL", value: env.BETTER_AUTH_URL },
  ]

  const missingVars = requiredVars.filter((envVar) => !envVar.value)

  if (missingVars.length > 0) {
    const missing = missingVars.map((envVar) => envVar.name).join(", ")
    throw new Error(
      `Missing required environment variables for authentication: ${missing}. ` +
        "Please set these variables before starting the server."
    )
  }
}

// Validate environment variables before creating auth instance
validateAuthEnvVars()

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",

    schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
})
