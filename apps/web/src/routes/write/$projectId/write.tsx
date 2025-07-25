import { createFileRoute } from "@tanstack/react-router"
import TiptapEditor from "@/components/tiptap-editor"

export const Route = createFileRoute("/write/$projectId/write")({
  component: WriteInterface,
})

function WriteInterface() {
  return (
    <div className="h-full w-full">
      <TiptapEditor
        content=""
        onUpdate={(_content) => {
          // TODO: Implement auto-save functionality
        }}
      />
    </div>
  )
}
