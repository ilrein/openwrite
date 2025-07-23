import { createFileRoute } from "@tanstack/react-router"
import { FileText, MapPin, Plus, Scroll, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/write/$novelId/codex/$type")({
  component: CodexTypeInterface,
})

function CodexTypeInterface() {
  const { type } = Route.useParams()

  const getTypeConfig = (typeParam: string) => {
    switch (typeParam) {
      case "characters":
        return {
          title: "Characters",
          description: "Manage your story's characters",
          icon: Users,
          entries: [
            {
              name: "Aria",
              role: "Protagonist",
              description: "A young mage discovering her powers",
            },
            {
              name: "Kellan",
              role: "Mentor",
              description: "An experienced warrior with a mysterious past",
            },
            {
              name: "The Guardian",
              role: "Antagonist",
              description: "Ancient protector of the crystal",
            },
          ],
        }
      case "locations":
        return {
          title: "Locations",
          description: "Track your story's places and settings",
          icon: MapPin,
          entries: [
            {
              name: "The Dark Forest",
              role: "Setting",
              description: "An ancient forest filled with magical creatures",
            },
            {
              name: "Crystal Cave",
              role: "Key Location",
              description: "Hidden cavern containing the ancient crystal",
            },
            {
              name: "Village of Elderbrook",
              role: "Starting Point",
              description: "Aria's peaceful hometown",
            },
          ],
        }
      case "lore":
        return {
          title: "Lore & World-building",
          description: "Document your world's history and rules",
          icon: Scroll,
          entries: [
            {
              name: "Magic System",
              role: "Core Rule",
              description: "Elemental magic drawn from nature's energy",
            },
            {
              name: "The Ancient Prophecy",
              role: "Plot Device",
              description: "Foretells the coming of a chosen one",
            },
            {
              name: "The Great War",
              role: "History",
              description: "A conflict that shaped the modern world",
            },
          ],
        }
      case "plot":
        return {
          title: "Plot Threads",
          description: "Track your story's narrative threads and arcs",
          icon: FileText,
          entries: [
            {
              name: "Quest for the Crystal",
              role: "Main Plot",
              description: "The primary journey driving the story",
            },
            {
              name: "Kellan's Secret Past",
              role: "Subplot",
              description: "Mysteries surrounding the mentor's history",
            },
            {
              name: "The Prophecy Unfolds",
              role: "Subplot",
              description: "Gradual revelation of Aria's destiny",
            },
          ],
        }
      default:
        return {
          title: "Codex",
          description: "Manage your story elements",
          icon: FileText,
          entries: [],
        }
    }
  }

  const config = getTypeConfig(type)
  const IconComponent = config.icon

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-3 font-bold text-3xl">
              <IconComponent className="h-8 w-8" />
              {config.title}
            </h1>
            <p className="mt-2 text-muted-foreground">{config.description}</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add {type === "lore" ? "Entry" : type.slice(0, -1)}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {config.entries.map((entry) => (
            <Card className="cursor-pointer transition-shadow hover:shadow-lg" key={entry.name}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{entry.name}</CardTitle>
                    <CardDescription>{entry.role}</CardDescription>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{entry.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {config.entries.length === 0 && (
          <div className="py-12 text-center">
            <IconComponent className="mx-auto mb-4 h-16 w-16 opacity-50" />
            <h3 className="mb-2 font-medium text-xl">No {config.title.toLowerCase()} yet</h3>
            <p className="mb-6 text-muted-foreground">
              Create your first {type === "lore" ? "entry" : type.slice(0, -1)} to start building
              your story world.
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add {type === "lore" ? "Entry" : type.slice(0, -1)}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
