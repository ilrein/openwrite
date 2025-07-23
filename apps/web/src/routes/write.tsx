import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/write")({
  beforeLoad: async () => {
    try {
      const session = await authClient.getSession()
      // Better Auth returns an object with data property
      if (!session?.data?.session) {
        throw redirect({
          to: "/login",
        })
      }
    } catch (error) {
      // If it's a redirect, re-throw it
      if (error && typeof error === "object" && "href" in error) {
        throw error
      }
      // For other auth errors, redirect to login
      throw redirect({
        to: "/login",
      })
    }
  },
  component: () => <Outlet />,
})
