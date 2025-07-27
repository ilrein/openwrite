import { useQuery } from "@tanstack/react-query"
import { FileText, MapPin, Scroll, Settings, Sparkles, Star, Users, X, Zap } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { api, type Character } from "@/lib/api"

interface CodexModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  initialType?: string | null
  initialEntry?: string | null
}

type CodexEntry = Character | { id: string; name: string; description?: string }

export default function CodexModal({
  isOpen,
  onClose,
  projectId,
  initialType = null,
  initialEntry = null,
}: CodexModalProps) {
  const [selectedType, setSelectedType] = useState(initialType || "characters")
  const [selectedEntry, setSelectedEntry] = useState<string | null>(initialEntry)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // Fetch characters
  const { data: characters = [] } = useQuery({
    queryKey: ["characters", projectId],
    queryFn: async () => {
      const result = await api.characters.list(projectId)
      return result
    },
  })

  // Fetch locations
  const { data: locations = [] } = useQuery({
    queryKey: ["locations", projectId],
    queryFn: async () => {
      const result = await api.locations.list(projectId)
      return result
    },
  })

  // Mock data for lore entries and plot threads - will be replaced with real API calls later
  const loreEntries: Array<{ id: string; name: string; description: string }> = []
  const plotThreads: Array<{ id: string; name: string; description: string }> = []
  const notes: Array<{ id: string; name: string; description: string }> = []

  const getTypeConfig = (typeParam: string) => {
    switch (typeParam) {
      case "characters":
        return {
          title: "Characters",
          description: "Manage your story's characters",
          icon: Users,
          entries: characters.map((char) => ({
            ...char,
            description: char.description || "No description available",
          })),
        }
      case "locations":
        return {
          title: "Locations",
          description: "Track your story's places and settings",
          icon: MapPin,
          entries: locations.map((location) => ({
            ...location,
            description: location.description || "No description available",
          })),
        }
      case "lore":
        return {
          title: "Lore & World-building",
          description: "Document your world's history and rules",
          icon: Scroll,
          entries: loreEntries.map((lore) => ({
            ...lore,
            description: lore.description || "No description available",
          })),
        }
      case "plot":
        return {
          title: "Plot Threads",
          description: "Track your story's narrative threads and arcs",
          icon: FileText,
          entries: plotThreads.map((plot) => ({
            ...plot,
            description: plot.description || "No description available",
          })),
        }
      case "notes":
        return {
          title: "Notes & Ideas",
          description: "Quick notes and ideas for your story",
          icon: Zap,
          entries: notes.map((note) => ({
            ...note,
            description: note.description || "No description available",
          })),
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

  const config = getTypeConfig(selectedType)
  const IconComponent = config.icon

  const filteredEntries = config.entries.filter((entry) =>
    entry.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEntryClick = (entryName: string) => {
    setSelectedEntry(entryName)
    setIsCreating(false)
  }

  const handleCreateNew = () => {
    setSelectedEntry(null)
    setIsCreating(true)
  }

  const handleClose = () => {
    setSelectedEntry(null)
    setIsCreating(false)
    onClose()
  }

  const getSelectedEntryData = () => {
    if (!selectedEntry) {
      return null
    }
    return config.entries.find((entry) => entry.name === selectedEntry)
  }

  const selectedEntryData = getSelectedEntryData()

  const getEntryIcon = (_entry: CodexEntry, type: string) => {
    switch (type) {
      case "characters":
        return <Users className="h-4 w-4" />
      case "locations":
        return <MapPin className="h-4 w-4" />
      case "lore":
        return <Scroll className="h-4 w-4" />
      case "plot":
        return <FileText className="h-4 w-4" />
      case "notes":
        return <Zap className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStarredIcon = () => {
    return <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
  }

  const _getEntryTypeFromEntry = (entry: CodexEntry): string => {
    // Since role and type fields are removed, we'll use generic labels
    if ("appearance" in entry || "personality" in entry || "backstory" in entry) {
      return "Character"
    }
    if ("parentLocationId" in entry || "image" in entry) {
      return "Location"
    }
    return "Entry"
  }

  const getEntryRole = (_entry: CodexEntry, type: string): string => {
    // Return generic role based on type since specific role/type fields are removed
    switch (type) {
      case "characters":
        return "Character"
      case "locations":
        return "Location"
      case "lore":
        return "Lore Entry"
      case "plot":
        return "Plot Thread"
      case "notes":
        return "Note"
      default:
        return "Entry"
    }
  }

  // Helper function to render the right panel content
  const renderRightPanel = () => {
    if (isCreating) {
      return (
        <div className="h-full">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconComponent className="h-5 w-5" />
                <h3 className="font-semibold">Create New {selectedType.slice(0, -1)}</h3>
              </div>
              <Button onClick={() => setIsCreating(false)} size="sm" variant="ghost">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="h-[calc(100%-70px)] overflow-y-auto p-6">
            <div className="text-center text-muted-foreground">
              <IconComponent className="mx-auto mb-4 h-16 w-16 opacity-20" />
              <h3 className="mb-2 font-semibold">Create New {selectedType.slice(0, -1)}</h3>
              <p className="mb-4 text-sm">
                Creation forms for {selectedType} will be implemented here.
              </p>
              <p className="text-xs">
                For now, use the sidebar "New" buttons to create {selectedType}.
              </p>
            </div>
          </div>
        </div>
      )
    }

    if (selectedEntryData) {
      return (
        <div className="h-full">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getEntryIcon(selectedEntryData, selectedType)}
                <div>
                  <h3 className="font-semibold">{selectedEntryData.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {getEntryRole(selectedEntryData, selectedType)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Star className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add to favorites</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button onClick={() => setSelectedEntry(null)} size="sm" variant="ghost">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="h-[calc(100%-70px)] overflow-y-auto">
            <div className="p-6">
              <Tabs className="w-full" defaultValue="overview">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="connections">Connections</TabsTrigger>
                </TabsList>

                <TabsContent className="mt-6" value="overview">
                  <div className="space-y-6">
                    <div>
                      <h4 className="mb-2 font-medium">Description</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {selectedEntryData.description}
                      </p>
                    </div>

                    {/* Character appearance and personality fields removed - simplified to just name and description */}
                  </div>
                </TabsContent>

                <TabsContent className="mt-6" value="details">
                  <div className="space-y-6">
                    {/* Character backstory and motivation fields removed - simplified to just name and description */}

                    {selectedType === "locations" && (
                      <div>
                        <h4 className="mb-2 font-medium">Location Details</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {selectedEntryData.description}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent className="mt-6" value="connections">
                  <div className="space-y-4">
                    <h4 className="font-medium">Related Elements</h4>
                    <p className="text-muted-foreground text-sm">
                      Connections and relationships will be shown here.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <IconComponent className="mx-auto mb-4 h-16 w-16 opacity-20" />
          <h3 className="mb-2 font-semibold">{config.title}</h3>
          <p className="mb-4 text-muted-foreground text-sm">{config.description}</p>
          <Button onClick={handleCreateNew}>Create New {selectedType.slice(0, -1)}</Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogContent className="h-[90vh] max-w-6xl overflow-hidden p-0">
        <div className="flex h-full">
          {/* Left Sidebar - Type Selection */}
          <div className="w-64 border-r bg-muted/50">
            <div className="p-4">
              <DialogHeader>
                <DialogTitle className="text-left">Codex</DialogTitle>
                <DialogDescription className="text-left">
                  Manage your story elements
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="space-y-1 p-2">
              {[
                { key: "characters", label: "Characters", icon: Users, count: characters.length },
                { key: "locations", label: "Locations", icon: MapPin, count: locations.length },
                { key: "lore", label: "Lore", icon: Scroll, count: loreEntries.length },
                { key: "plot", label: "Plot Threads", icon: FileText, count: plotThreads.length },
                { key: "notes", label: "Notes", icon: Zap, count: notes.length },
              ].map((item) => (
                <Button
                  className={`w-full justify-start ${selectedType === item.key ? "bg-accent" : ""}`}
                  key={item.key}
                  onClick={() => {
                    setSelectedType(item.key)
                    setSelectedEntry(null)
                    setIsCreating(false)
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.label}
                  <Badge className="ml-auto" variant="secondary">
                    {item.count}
                  </Badge>
                </Button>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="p-4">
              <div className="space-y-2">
                <Button
                  className="w-full gap-2"
                  onClick={handleCreateNew}
                  size="sm"
                  variant="outline"
                >
                  <Sparkles className="h-4 w-4" />
                  Create New
                </Button>
                <Button className="w-full gap-2" size="sm" variant="outline">
                  <Settings className="h-4 w-4" />
                  Templates
                </Button>
              </div>
            </div>
          </div>

          {/* Middle Panel - Entry List */}
          <div className="w-80 border-r">
            <div className="border-b p-4">
              <div className="flex items-center gap-3">
                <IconComponent className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">{config.title}</h3>
                  <p className="text-muted-foreground text-xs">{config.description}</p>
                </div>
              </div>
              <Input
                className="mt-3"
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${config.title.toLowerCase()}...`}
                value={searchTerm}
              />
            </div>

            <div className="h-[calc(100vh-200px)] overflow-y-auto">
              <div className="space-y-1 p-2">
                {filteredEntries.map((entry) => (
                  <Card
                    className={`cursor-pointer transition-all hover:bg-accent/50 ${
                      selectedEntry === entry.name ? "bg-accent" : ""
                    }`}
                    key={entry.name}
                    onClick={() => handleEntryClick(entry.name)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getEntryIcon(entry, selectedType)}
                          <CardTitle className="text-sm">{entry.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStarredIcon()}
                          <Badge className="text-xs" variant="outline">
                            {getEntryRole(entry, selectedType)}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2 text-xs">
                        {entry.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}

                {filteredEntries.length === 0 && !isCreating && (
                  <div className="py-8 text-center text-muted-foreground">
                    <IconComponent className="mx-auto mb-3 h-12 w-12 opacity-20" />
                    <p className="mb-2 font-medium">No {config.title.toLowerCase()} found</p>
                    <p className="text-sm">
                      {searchTerm
                        ? "Try adjusting your search"
                        : `Create your first ${selectedType.slice(0, -1)}`}
                    </p>
                    {!searchTerm && (
                      <Button className="mt-3" onClick={handleCreateNew} size="sm">
                        Create New
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Entry Details/Form */}
          <div className="flex-1">{renderRightPanel()}</div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
