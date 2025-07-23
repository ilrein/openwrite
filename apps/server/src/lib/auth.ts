import { betterAuth } from "better-auth"
import { organization } from "better-auth/plugins"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../db"
import { 
  account, 
  session, 
  user, 
  verification,
  organization as organizationTable,
  member,
  invitation,
  team,
  teamMember
} from "../db/schema"

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
          organization: organizationTable,
          member,
          invitation,
          team,
          teamMember,
        },
      }),
      databaseHooks: {
        user: {
          create: {
            after: async (createdUser) => {
              // Automatically create a personal organization for new users
              const orgId = crypto.randomUUID()
              const memberId = crypto.randomUUID()
              const now = new Date()

              // Create personal organization
              await db.insert(organizationTable).values({
                id: orgId,
                name: `${createdUser.name}'s Workspace`,
                slug: `${createdUser.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
                createdAt: now,
                updatedAt: now
              })

              // Add user as owner
              await db.insert(member).values({
                id: memberId,
                userId: createdUser.id,
                organizationId: orgId,
                role: "owner",
                createdAt: now
              })
            }
          }
        }
      },
      plugins: [
        organization({
          // Enable teams/sub-organizations
          teams: {
            enabled: true,
            maximumTeams: 10, // Limit teams per organization
            allowRemovingAllTeams: false, // Prevent removing the last team
          },
          // Organization creation settings
          organizationCreation: {
            disabled: false,
            afterCreate: ({ organization: _createdOrg, user: _orgUser }) => {
              // Set up default resources for manually created organizations
              // Could add default resources, notifications, etc. here in the future
            }
          }
        })
      ],
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
