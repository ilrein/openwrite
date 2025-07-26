import { useQuery } from "@tanstack/react-query"
import { FileText, MapPin, Plus, Scroll, Users } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { api, type Character } from "@/lib/api"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Dialog, DialogContent } from "./ui/dialog"

interface CodexEntry {
  name: string
  role: string
  description: string
}

type CodexCharacterEntry = Character | CodexEntry

interface CodexModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  initialType?: string | null
  initialEntry?: string | null
}

export default function CodexModal({
  isOpen,
  onClose,
  projectId,
  initialType = null,
  initialEntry = null,
}: CodexModalProps) {
  const [selectedType, setSelectedType] = useState<string | null>(initialType)
  const [selectedEntry, setSelectedEntry] = useState<CodexCharacterEntry | null>(null)

  // Fetch characters from API
  const { data: characters = [] } = useQuery({
    queryKey: ["characters", projectId],
    queryFn: async () => {
      const result = await api.characters.list(projectId)
      return result
    },
    enabled: isOpen, // Only fetch when modal is open
  })

  const getTypeConfig = useCallback(
    (typeParam: string) => {
      switch (typeParam) {
        case "characters":
          return {
            title: "Characters",
            description: "Manage your story's characters",
            icon: Users,
            entries: characters.map((char) => ({
              ...char,
              role: char.role || "Character",
              description: char.description || "No description available",
            })),
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
                description:
                  "An ancient forest filled with magical creatures and hidden dangers. The trees themselves seem alive, and the deeper one ventures, the more the magic affects reality itself.",
              },
              {
                name: "Crystal Cave",
                role: "Key Location",
                description:
                  "Hidden cavern containing the ancient crystal that holds the power to reshape the world. The cave is protected by ancient wards and magical traps.",
              },
              {
                name: "Village of Elderbrook",
                role: "Starting Point",
                description:
                  "Aria's peaceful hometown nestled in a valley surrounded by rolling hills. This quiet farming community has been untouched by the magical conflicts of the wider world.",
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
                description:
                  "Elemental magic drawn from nature's energy requires emotional balance and physical gestures. Overuse can lead to magical exhaustion or even permanent damage to the caster's connection to magic.",
              },
              {
                name: "The Ancient Prophecy",
                role: "Plot Device",
                description:
                  "Foretells the coming of a chosen one who will either restore balance to the world or bring about its destruction. The prophecy speaks in riddles that have been interpreted differently throughout history.",
              },
              {
                name: "The Great War",
                role: "History",
                description:
                  "A conflict that shaped the modern world, pitting those who would use magic freely against those who feared its power. The war ended with magical restrictions that still influence society today.",
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
                description:
                  "The primary journey driving the story as Aria seeks the legendary crystal that could restore balance to magic itself. This quest will test her abilities and force difficult choices.",
              },
              {
                name: "Kellan's Secret Past",
                role: "Subplot",
                description:
                  "Mysteries surrounding the mentor's history gradually reveal his connection to the Great War and the true reason he's helping Aria on her quest.",
              },
              {
                name: "The Prophecy Unfolds",
                role: "Subplot",
                description:
                  "Gradual revelation of Aria's destiny and the true meaning of the ancient prophecy, which may not be what anyone expected.",
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
    },
    [characters]
  )

  const codexTypes = [
    { key: "characters", title: "Characters", icon: Users },
    { key: "locations", title: "Locations", icon: MapPin },
    { key: "lore", title: "Lore", icon: Scroll },
    { key: "plot", title: "Plot Threads", icon: FileText },
  ]

  // Handle initial navigation when modal opens
  useEffect(() => {
    if (isOpen && initialType && initialEntry) {
      setSelectedType(initialType)
      const typeConfig = getTypeConfig(initialType)
      const entry = typeConfig.entries.find((e) => e.name === initialEntry)
      if (entry) {
        setSelectedEntry(entry)
      }
    } else if (isOpen && initialType) {
      setSelectedType(initialType)
      setSelectedEntry(null)
    } else if (isOpen) {
      setSelectedType(null)
      setSelectedEntry(null)
    }
  }, [isOpen, initialType, initialEntry, getTypeConfig])

  const handleEntryClick = (entry: CodexCharacterEntry) => {
    setSelectedEntry(entry)
  }

  const handleBackToType = () => {
    setSelectedEntry(null)
  }

  const handleBackToOverview = () => {
    setSelectedType(null)
    setSelectedEntry(null)
  }

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="mb-8 text-center">
        <h2 className="mb-2 font-bold text-2xl">Project Codex</h2>
        <p className="text-muted-foreground">Manage all aspects of your story world</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {codexTypes.map((type) => {
          const config = getTypeConfig(type.key)
          const IconComponent = type.icon

          return (
            <Card
              className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
              key={type.key}
              onClick={() => setSelectedType(type.key)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <IconComponent className="h-6 w-6" />
                  {type.title}
                </CardTitle>
                <CardDescription>{config.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    {config.entries.length} items
                  </span>
                  <Badge variant="outline">View All</Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  const renderTypeView = () => {
    if (!selectedType) {
      return null
    }

    const config = getTypeConfig(selectedType)
    const IconComponent = config.icon

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={handleBackToOverview} size="sm" variant="ghost">
            ← Back to Codex
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-3 font-bold text-2xl">
              <IconComponent className="h-7 w-7" />
              {config.title}
            </h2>
            <p className="mt-1 text-muted-foreground">{config.description}</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {config.entries.map((entry) => (
            <Card
              className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
              key={entry.name}
              onClick={() => handleEntryClick(entry)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{entry.name}</CardTitle>
                    <CardDescription>{entry.role}</CardDescription>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm">{entry.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {config.entries.length === 0 && (
          <div className="py-16 text-center">
            <IconComponent className="mx-auto mb-4 h-16 w-16 opacity-50" />
            <h3 className="mb-2 font-medium text-xl">No {config.title.toLowerCase()} yet</h3>
            <p className="mb-6 text-muted-foreground">
              Create your first item to start building your story world.
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Helper function to check if entry is a Character object
  const isCharacter = (entry: CodexCharacterEntry): entry is Character => {
    return "id" in entry
  }

  // Helper function to get display role
  const getDisplayRole = (entry: CodexCharacterEntry): string => {
    if (isCharacter(entry)) {
      return entry.role || "Character"
    }
    return entry.role
  }

  // Helper function to get display description
  const getDisplayDescription = (entry: CodexCharacterEntry): string => {
    if (isCharacter(entry)) {
      return entry.description || "No description available"
    }
    return entry.description
  }

  const renderEntryDetail = () => {
    if (!(selectedEntry && selectedType)) {
      return null
    }

    const config = getTypeConfig(selectedType)
    const IconComponent = config.icon
    const isCharacterEntry = isCharacter(selectedEntry)

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={handleBackToType} size="sm" variant="ghost">
            ← Back to {config.title}
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="font-bold text-2xl">{selectedEntry.name}</h2>
              <div className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                <Badge variant="secondary">{getDisplayRole(selectedEntry)}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">
                Edit
              </Button>
              <Button size="sm" variant="outline">
                Delete
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed">{getDisplayDescription(selectedEntry)}</p>
            </CardContent>
          </Card>

          {isCharacterEntry && (
            <>
              {selectedEntry.appearance && (
                <Card>
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed">{selectedEntry.appearance}</p>
                  </CardContent>
                </Card>
              )}

              {selectedEntry.personality && (
                <Card>
                  <CardHeader>
                    <CardTitle>Personality</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed">{selectedEntry.personality}</p>
                  </CardContent>
                </Card>
              )}

              {selectedEntry.backstory && (
                <Card>
                  <CardHeader>
                    <CardTitle>Backstory</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed">{selectedEntry.backstory}</p>
                  </CardContent>
                </Card>
              )}

              {selectedEntry.motivation && (
                <Card>
                  <CardHeader>
                    <CardTitle>Motivation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-relaxed">{selectedEntry.motivation}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!isCharacterEntry && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  No additional notes yet. Click Edit to add more details.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog onOpenChange={onClose} open={isOpen}>
      <DialogContent className="h-screen min-w-full overflow-hidden p-0">
        <div className="flex h-full">
          {/* Main Content */}
          <div className="flex-1 overflow-auto p-6">
            {(() => {
              if (selectedEntry) {
                return renderEntryDetail()
              }
              if (selectedType) {
                return renderTypeView()
              }
              return renderOverview()
            })()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
