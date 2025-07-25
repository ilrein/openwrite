import { createFileRoute } from "@tanstack/react-router"
import { DualSidebarWritingInterface } from "@/components/dual-sidebar-writing-interface"

export const Route = createFileRoute("/dashboard/project/$projectId/write")({
  component: ProjectWritePage,
})

function ProjectWritePage() {
  const { projectId } = Route.useParams()

  return (
    <DualSidebarWritingInterface
      content=""
      onUpdate={(_content) => {
        // TODO: Implement auto-save functionality
      }}
      placeholder="Begin your story... Ask the AI assistant for help with characters, plot, or writing style."
      projectId={projectId}
    />
  )
}
