import { createFileRoute } from "@tanstack/react-router"
import TiptapEditor from "@/components/tiptap-editor"

export const Route = createFileRoute("/write/$novelId/write")({
  component: WriteInterface,
})

function WriteInterface() {
  return (
    <div className="h-full w-full bg-muted p-4">
      <TiptapEditor
        content=""
        onUpdate={(_content) => {
          // TODO: Implement auto-save functionality
        }}
      />
    </div>
  )
}
