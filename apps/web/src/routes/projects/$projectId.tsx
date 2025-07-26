import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import {
  ChevronDown,
  ChevronRight,
  FileEdit,
  FileText,
  MapPin,
  PenTool,
  Scroll,
  Users,
} from "lucide-react"
import { useState } from "react"
import CodexModal from "@/components/codex-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import WriteHeader from "@/components/write-header"
import { api } from "@/lib/api"

export const Route = createFileRoute("/projects/$projectId")({
  component: WriteLayout,
})

function WriteLayout() {
  const { projectId } = Route.useParams()
  const [isCodexModalOpen, setIsCodexModalOpen] = useState(false)
  const [codexModalConfig, setCodexModalConfig] = useState<{
    initialType?: string | null
    initialEntry?: string | null
  }>({})
  const [expandedCodexSections, setExpandedCodexSections] = useState<Record<string, boolean>>({
    characters: false,
    locations: false,
    lore: false,
    plot: false,
  })

  // Fetch project details
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const result = await api.projects.get(projectId)
      return result
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 font-semibold text-2xl">Project not found</h2>
          <Link to="/dashboard/projects">
            <Button variant="outline">Back to Projects</Button>
          </Link>
        </div>
      </div>
    )
  }

  const targetWordCount = project.targetWordCount || 0
  const progressPercentage = targetWordCount
    ? Math.min((project.currentWordCount / targetWordCount) * 100, 100)
    : 0

  const toggleCodexSection = (section: string) => {
    setExpandedCodexSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const openCodexModal = (type?: string, entry?: string) => {
    setCodexModalConfig({
      initialType: type || null,
      initialEntry: entry || null,
    })
    setIsCodexModalOpen(true)
  }

  const closeCodexModal = () => {
    setIsCodexModalOpen(false)
    setCodexModalConfig({})
  }

  const codexData = {
    characters: [
      { name: "Aria", role: "Protagonist" },
      { name: "Kellan", role: "Mentor" },
      { name: "The Guardian", role: "Antagonist" },
    ],
    locations: [
      { name: "The Dark Forest", role: "Setting" },
      { name: "Crystal Cave", role: "Key Location" },
      { name: "Village of Elderbrook", role: "Starting Point" },
    ],
    lore: [
      { name: "Magic System", role: "Core Rule" },
      { name: "The Ancient Prophecy", role: "Plot Device" },
      { name: "The Great War", role: "History" },
    ],
    plot: [
      { name: "Quest for the Crystal", role: "Main Plot" },
      { name: "Kellan's Secret Past", role: "Subplot" },
      { name: "The Prophecy Unfolds", role: "Subplot" },
    ],
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Writing Sidebar */}
        <Sidebar>
          <SidebarHeader>
            <div className="px-4 py-2">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  {project.currentWordCount.toLocaleString()} words
                </p>
                {project.targetWordCount && (
                  <div>
                    <Progress className="h-2" value={progressPercentage} />
                    <p className="mt-1 text-muted-foreground text-xs">
                      {Math.round(progressPercentage)}% of{" "}
                      {project.targetWordCount.toLocaleString()} word goal
                    </p>
                  </div>
                )}
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Structure</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link params={{ projectId }} to="/projects/$projectId/outline">
                        <FileText />
                        <span>Outline</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link params={{ projectId }} to="/write/$projectId">
                        <PenTool />
                        <span>Write</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Codex</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Characters */}
                  <SidebarMenuItem>
                    <Collapsible
                      onOpenChange={() => toggleCodexSection("characters")}
                      open={expandedCodexSections.characters}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          {expandedCodexSections.characters ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <Users className="h-4 w-4" />
                          <span>Characters</span>
                          <Badge className="ml-auto" variant="secondary">
                            {codexData.characters.length}
                          </Badge>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 space-y-1">
                          {codexData.characters.map((character) => (
                            <Button
                              className="w-full justify-start"
                              key={character.name}
                              onClick={() => openCodexModal("characters", character.name)}
                              size="sm"
                              variant="ghost"
                            >
                              <span className="truncate">{character.name}</span>
                              <span className="ml-auto text-muted-foreground text-xs">
                                {character.role}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>

                  {/* Locations */}
                  <SidebarMenuItem>
                    <Collapsible
                      onOpenChange={() => toggleCodexSection("locations")}
                      open={expandedCodexSections.locations}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          {expandedCodexSections.locations ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <MapPin className="h-4 w-4" />
                          <span>Locations</span>
                          <Badge className="ml-auto" variant="secondary">
                            {codexData.locations.length}
                          </Badge>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 space-y-1">
                          {codexData.locations.map((location) => (
                            <Button
                              className="w-full justify-start"
                              key={location.name}
                              onClick={() => openCodexModal("locations", location.name)}
                              size="sm"
                              variant="ghost"
                            >
                              <span className="truncate">{location.name}</span>
                              <span className="ml-auto text-muted-foreground text-xs">
                                {location.role}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>

                  {/* Lore */}
                  <SidebarMenuItem>
                    <Collapsible
                      onOpenChange={() => toggleCodexSection("lore")}
                      open={expandedCodexSections.lore}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          {expandedCodexSections.lore ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <Scroll className="h-4 w-4" />
                          <span>Lore</span>
                          <Badge className="ml-auto" variant="secondary">
                            {codexData.lore.length}
                          </Badge>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 space-y-1">
                          {codexData.lore.map((loreItem) => (
                            <Button
                              className="w-full justify-start"
                              key={loreItem.name}
                              onClick={() => openCodexModal("lore", loreItem.name)}
                              size="sm"
                              variant="ghost"
                            >
                              <span className="truncate">{loreItem.name}</span>
                              <span className="ml-auto text-muted-foreground text-xs">
                                {loreItem.role}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>

                  {/* Plot Threads */}
                  <SidebarMenuItem>
                    <Collapsible
                      onOpenChange={() => toggleCodexSection("plot")}
                      open={expandedCodexSections.plot}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          {expandedCodexSections.plot ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <FileText className="h-4 w-4" />
                          <span>Plot Threads</span>
                          <Badge className="ml-auto" variant="secondary">
                            {codexData.plot.length}
                          </Badge>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 space-y-1">
                          {codexData.plot.map((plotItem) => (
                            <Button
                              className="w-full justify-start"
                              key={plotItem.name}
                              onClick={() => openCodexModal("plot", plotItem.name)}
                              size="sm"
                              variant="ghost"
                            >
                              <span className="truncate">{plotItem.name}</span>
                              <span className="ml-auto text-muted-foreground text-xs">
                                {plotItem.role}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Chapters</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton>
                                <ChevronRight className="h-4 w-4" />
                                <span className="truncate">
                                  Chapter 1: The Beginning and the Call to Adventure
                                </span>
                                <Badge className="ml-auto" variant="secondary">
                                  3
                                </Badge>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>Chapter 1: The Beginning and the Call to Adventure</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 space-y-1">
                          <Button className="w-full justify-start" size="sm" variant="ghost">
                            Scene 1: Opening
                          </Button>
                          <Button className="w-full justify-start" size="sm" variant="ghost">
                            Scene 2: Conflict
                          </Button>
                          <Button className="w-full justify-start" size="sm" variant="ghost">
                            Scene 3: Resolution
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton>
                                <ChevronRight className="h-4 w-4" />
                                <span className="truncate">
                                  Chapter 2: The Journey Through the Dark Forest
                                </span>
                                <Badge className="ml-auto" variant="secondary">
                                  2
                                </Badge>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>Chapter 2: The Journey Through the Dark Forest</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 space-y-1">
                          <Button className="w-full justify-start" size="sm" variant="ghost">
                            Scene 1: Departure
                          </Button>
                          <Button className="w-full justify-start" size="sm" variant="ghost">
                            Scene 2: Discovery
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div className="p-4">
              <Button className="w-full" size="sm">
                <FileEdit className="mr-2 h-4 w-4" />
                Quick Notes
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <WriteHeader
            breadcrumbs={[
              { label: "Dashboard", to: "/dashboard" },
              { label: "Projects", to: "/dashboard/projects" },
              { label: project.title },
            ]}
          />

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>

          {/* Status Bar */}
          <footer className="border-t px-6 py-2">
            <div className="flex items-center justify-between text-muted-foreground text-sm">
              <div className="flex items-center gap-4">
                <span>Current Scene: Chapter 1, Scene 2</span>
                <Separator className="h-4" orientation="vertical" />
                <span>Last saved: 2 minutes ago</span>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="secondary">Auto-save: On</Badge>
                <span>Writing session: 45 minutes</span>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Codex Modal */}
      <CodexModal
        initialEntry={codexModalConfig.initialEntry}
        initialType={codexModalConfig.initialType}
        isOpen={isCodexModalOpen}
        onClose={closeCodexModal}
        projectId={projectId}
      />
    </SidebarProvider>
  )
}
