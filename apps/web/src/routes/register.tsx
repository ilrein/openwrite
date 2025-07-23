import { createFileRoute, redirect } from "@tanstack/react-router"
import LoginBlock from "@/components/login-block"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/register")({
  component: RouteComponent,
  beforeLoad: async () => {
    try {
      const session = await authClient.getSession()
      // Better Auth returns an object with data property
      if (session?.data?.session) {
        throw redirect({
          to: "/dashboard",
        })
      }
    } catch (error) {
      // If it's a redirect, re-throw it
      if (error && typeof error === "object" && "href" in error) {
        throw error
      }
      // Otherwise ignore auth errors and continue to register page
    }
  },
})

function RouteComponent() {
  const navigate = Route.useNavigate()

  return (
    <LoginBlock
      mode="signup"
      onModeChange={() => {
        // Navigate to login page when switching to signin
        navigate({ to: "/login" })
      }}
    />
  )
}
