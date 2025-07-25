import { createFileRoute } from "@tanstack/react-router"
import { SidebarWritingInterface } from "@/components/sidebar-writing-interface"

export const Route = createFileRoute("/projects/$projectId/write")({
  component: WriteInterface,
})

function WriteInterface() {
  return (
    <div className="h-full w-full">
      <SidebarWritingInterface
        content=""
        onUpdate={(_content) => {
          // TODO: Implement auto-save functionality
        }}
        placeholder="Begin your story... Ask the AI assistant for help with characters, plot, or writing style."
      />
    </div>
  )
}
