import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router"
import { Edit3, FileText, MessageCircle, Settings, Users } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { AISidebarProvider, useAISidebar } from "@/contexts/ai-sidebar-context"
import { api } from "@/lib/api"

export const Route = createFileRoute("/dashboard/project/$projectId")({
  component: () => (
    <AISidebarProvider>
      <ProjectLayout />
    </AISidebarProvider>
  ),
})

function ProjectLayout() {
  const { projectId: id } = Route.useParams()
  const location = useLocation()
  const { isOpen: aiSidebarOpen, toggle: toggleAISidebar } = useAISidebar()

  // Check if we're on the write page
  const isWritePage = location.pathname.includes("/write")

  // Fetch project details
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const result = await api.projects.get(id)
      return result
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="animate-pulse">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 font-semibold text-2xl text-gray-900">Project not found</h2>
          <Link to="/dashboard/projects">
            <Button variant="outline">Back to Projects</Button>
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
                  <Link to="/dashboard/projects">Projects</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{project.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Title and Stats */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-2xl">{project.title}</h1>
              {project.description && <p className="mt-1">{project.description}</p>}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm opacity-75">
                {project.currentWordCount.toLocaleString()} /{" "}
                {project.targetWordCount?.toLocaleString() || "∞"} words
              </div>

              {/* AI Assistant Toggle - Only show on write page */}
              {isWritePage && (
                <Button className="gap-2" onClick={toggleAISidebar} size="sm" variant="outline">
                  <MessageCircle className="h-4 w-4" />
                  {aiSidebarOpen ? "Hide AI" : "Show AI"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex space-x-6">
          <Link
            activeProps={{ className: "text-blue-600 border-blue-600" }}
            className="flex items-center border-transparent border-b-2 px-3 py-2 font-medium text-sm [&.active]:border-blue-600 [&.active]:text-blue-600"
            params={{ projectId: id }}
            to="/projects/$projectId/write"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Write
          </Link>

          <Link
            activeProps={{ className: "text-blue-600 border-blue-600" }}
            className="flex items-center border-transparent border-b-2 px-3 py-2 font-medium text-sm [&.active]:border-blue-600 [&.active]:text-blue-600"
            params={{ projectId: id }}
            to="/dashboard/project/$projectId/outline"
          >
            <FileText className="mr-2 h-4 w-4" />
            Outline
          </Link>

          <Link
            activeProps={{ className: "text-blue-600 border-blue-600" }}
            className="flex items-center border-transparent border-b-2 px-3 py-2 font-medium text-sm [&.active]:border-blue-600 [&.active]:text-blue-600"
            params={{ projectId: id }}
            to="/dashboard/project/$projectId/characters"
          >
            <Users className="mr-2 h-4 w-4" />
            Characters
          </Link>

          <Link
            activeProps={{ className: "text-blue-600 border-blue-600" }}
            className="flex items-center border-transparent border-b-2 px-3 py-2 font-medium text-sm [&.active]:border-blue-600 [&.active]:text-blue-600"
            params={{ projectId: id }}
            to="/dashboard/project/$projectId/settings"
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
