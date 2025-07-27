import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { StatusBar } from "@/components/status-bar"
import TiptapEditor from "@/components/tiptap-editor"
import { api } from "@/lib/api"

export const Route = createFileRoute("/projects/$projectId/write")({
  component: WriteInterface,
})

function WriteInterface() {
  const { projectId } = Route.useParams()

  // Fetch project details for word count
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const result = await api.projects.get(projectId)
      return result
    },
  })

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto">
        <TiptapEditor
          content=""
          onUpdate={(_content) => {
            // TODO: Implement auto-save functionality
          }}
          placeholder="Begin your story... Ask the AI assistant for help with characters, plot, or writing style."
        />
      </div>
      {project && (
        <StatusBar lastSavedText="Last saved: 2 minutes ago" wordCount={project.currentWordCount} />
      )}
    </div>
  )
}
