import { createFileRoute } from "@tanstack/react-router"
import TiptapEditor from "@/components/tiptap-editor"

export const Route = createFileRoute("/write/$novelId/write")({
  component: WriteInterface,
})

function WriteInterface() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-4xl">
          <div className="prose prose-lg min-h-[600px] max-w-none">
            <TiptapEditor
              content=""
              onUpdate={(_content) => {
                // TODO: Implement auto-save functionality
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
