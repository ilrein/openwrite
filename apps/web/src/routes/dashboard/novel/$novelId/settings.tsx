import { createFileRoute } from "@tanstack/react-router"
import { Settings } from "lucide-react"

export const Route = createFileRoute("/dashboard/novel/$novelId/settings")({
  component: NovelSettingsPage,
})

function NovelSettingsPage() {
  return (
    <div className="flex-1 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="py-12 text-center">
          <Settings className="mx-auto mb-4 h-16 w-16 opacity-50" />
          <h3 className="mb-2 font-medium text-xl">Settings Coming Soon</h3>
          <p>
            This is where you'll be able to configure your novel's settings, including title,
            description, genre, visibility, and export options.
          </p>
        </div>
      </div>
    </div>
  )
}
