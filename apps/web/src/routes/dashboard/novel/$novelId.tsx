import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import { Edit3, FileText, Settings, Users } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

export const Route = createFileRoute("/dashboard/novel/$novelId")({
  component: NovelLayout,
})

function NovelLayout() {
  const { novelId: id } = Route.useParams()

  // Fetch novel details
  const { data: novel, isLoading } = useQuery({
    queryKey: ["novel", id],
    queryFn: async () => {
      const result = await api.novels.get(id)
      return result
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="animate-pulse">Loading novel...</div>
      </div>
    )
  }

  if (!novel) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 font-semibold text-2xl text-gray-900">Novel not found</h2>
          <Link to="/dashboard/novels">
            <Button variant="outline">Back to Novels</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex flex-col space-y-4">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard/novels">Novels</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{novel.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Title and Stats */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-2xl">{novel.title}</h1>
              {novel.description && <p className="mt-1">{novel.description}</p>}
            </div>

            <div className="text-sm opacity-75">
              {novel.currentWordCount.toLocaleString()} /{" "}
              {novel.targetWordCount?.toLocaleString() || "∞"} words
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex space-x-6">
          <Link
            activeProps={{ className: "text-blue-600 border-blue-600" }}
            className="flex items-center border-transparent border-b-2 px-3 py-2 font-medium text-sm [&.active]:border-blue-600 [&.active]:text-blue-600"
            params={{ novelId: id }}
            to="/dashboard/novel/$novelId/write"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Write
          </Link>

          <Link
            activeProps={{ className: "text-blue-600 border-blue-600" }}
            className="flex items-center border-transparent border-b-2 px-3 py-2 font-medium text-sm [&.active]:border-blue-600 [&.active]:text-blue-600"
            params={{ novelId: id }}
            to="/dashboard/novel/$novelId/outline"
          >
            <FileText className="mr-2 h-4 w-4" />
            Outline
          </Link>

          <Link
            activeProps={{ className: "text-blue-600 border-blue-600" }}
            className="flex items-center border-transparent border-b-2 px-3 py-2 font-medium text-sm [&.active]:border-blue-600 [&.active]:text-blue-600"
            params={{ novelId: id }}
            to="/dashboard/novel/$novelId/characters"
          >
            <Users className="mr-2 h-4 w-4" />
            Characters
          </Link>

          <Link
            activeProps={{ className: "text-blue-600 border-blue-600" }}
            className="flex items-center border-transparent border-b-2 px-3 py-2 font-medium text-sm [&.active]:border-blue-600 [&.active]:text-blue-600"
            params={{ novelId: id }}
            to="/dashboard/novel/$novelId/settings"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
