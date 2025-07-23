import { createFileRoute } from "@tanstack/react-router"
import { Users } from "lucide-react"

export const Route = createFileRoute("/dashboard/novel/$novelId/characters")({
  component: NovelCharactersPage,
})

function NovelCharactersPage() {
  return (
    <div className="flex-1 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="py-12 text-center">
          <Users className="mx-auto mb-4 h-16 w-16 opacity-50" />
          <h3 className="mb-2 font-medium text-xl">Characters Coming Soon</h3>
          <p>
            This is where you'll be able to create and manage your novel's characters, their
            profiles, relationships, and development arcs.
          </p>
        </div>
      </div>
    </div>
  )
}
