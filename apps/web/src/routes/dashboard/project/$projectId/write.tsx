import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { SidebarWritingInterface } from "@/components/sidebar-writing-interface"
import { api } from "@/lib/api"

export const Route = createFileRoute("/dashboard/project/$projectId/write")({
  component: ProjectWritePage,
})

function ProjectWritePage() {
  const { projectId: id } = Route.useParams()

  // Fetch project content
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
        <div className="animate-pulse">Loading editor...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 font-semibold text-2xl text-gray-900">Project not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <SidebarWritingInterface
        content={project.content || ""}
        onUpdate={(_content) => {
          // TODO: Implement auto-save functionality
        }}
        placeholder={`Continue writing "${project.title}"... Ask the AI assistant for help with your story development.`}
      />
    </div>
  )
}
