import { createFileRoute, Outlet } from "@tanstack/react-router"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/write")({
  beforeLoad: async () => {
    try {
      const session = await authClient.getSession()
      if (!session) {
        throw new Error("Not authenticated")
      }
    } catch (_error) {
      throw new Error("Not authenticated")
    }
  },
  component: () => <Outlet />,
})
