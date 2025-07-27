import { createFileRoute } from "@tanstack/react-router"
import TiptapEditor from "@/components/tiptap-editor"

export const Route = createFileRoute("/projects/$projectId/write")({
  component: WriteInterface,
})

function WriteInterface() {
  const { projectId } = Route.useParams()

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 p-6">
        <TiptapEditor
          content=""
          onUpdate={(_content) => {
            // TODO: Implement auto-save functionality
          }}
          placeholder="Begin your story... Ask the AI assistant for help with characters, plot, or writing style."
        />
      </div>
    </div>
  )
}
