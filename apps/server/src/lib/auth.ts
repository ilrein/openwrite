import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../db"
import { account, session, user, verification } from "../db/schema/auth"

interface AuthEnv {
  CORS_ORIGIN: string
  BETTER_AUTH_SECRET: string
  BETTER_AUTH_URL: string
}

let authInstance: ReturnType<typeof betterAuth> | null = null

export function createAuthInstance(env: AuthEnv) {
  if (!authInstance) {
    // Validate required environment variables
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

    authInstance = betterAuth({
      database: drizzleAdapter(db, {
        provider: "sqlite",
        schema: {
          user,
          session,
          account,
          verification,
        },
      }),
      trustedOrigins: [env.CORS_ORIGIN],
      emailAndPassword: {
        enabled: true,
      },
      secret: env.BETTER_AUTH_SECRET,
      baseURL: env.BETTER_AUTH_URL,
    })
  }

  return authInstance
}

// For backward compatibility, export a function that gets the auth instance
export const getAuth = (env: AuthEnv) => createAuthInstance(env)
