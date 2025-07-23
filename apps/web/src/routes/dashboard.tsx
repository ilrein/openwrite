import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import { BookOpen } from "lucide-react"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
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
})

function DashboardLayout() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 shadow-lg">
        <div className="p-6">
          <h1 className="font-bold text-2xl">OpenWrite</h1>
        </div>

        <nav className="mt-8">
          <div className="px-6">
            <Link
              activeProps={{ className: "text-blue-600" }}
              className="flex items-center rounded-lg px-4 py-2 [&.active]:text-blue-600"
              to="/dashboard/novels"
            >
              <BookOpen className="mr-3 h-5 w-5" />
              Novels
            </Link>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
