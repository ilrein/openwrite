import { createFileRoute } from "@tanstack/react-router"
import { FileText } from "lucide-react"

export const Route = createFileRoute("/dashboard/project/$projectId/outline")({
  component: ProjectOutlinePage,
})

function ProjectOutlinePage() {
  return (
    <div className="flex-1 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="py-12 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 opacity-50" />
          <h3 className="mb-2 font-medium text-xl">Canvas Available in Projects</h3>
          <p>
            The Story Canvas feature is now available in the main Projects section. Use the new
            Canvas tool to create and manage your story structure with drag-and-drop elements.
          </p>
        </div>
      </div>
    </div>
  )
}
