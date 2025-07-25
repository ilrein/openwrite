import { useQuery } from "@tanstack/react-query"
import {
  ChevronDown,
  ChevronRight,
  FileEdit,
  FileText,
  MapPin,
  MessageCircle,
  PenTool,
  Scroll,
  Sparkles,
  Users,
} from "lucide-react"
import { useState } from "react"
import { AIChatContent } from "@/components/ai-chat-content"
import CodexModal from "@/components/codex-modal"
import TiptapEditor from "@/components/tiptap-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Progress } from "@/components/ui/progress"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { api } from "@/lib/api"

interface DualSidebarWritingInterfaceProps {
  projectId: string
  content?: string
  onUpdate?: (content: string) => void
  placeholder?: string
}

export function DualSidebarWritingInterface({
  projectId,
  content = "",
  onUpdate,
  placeholder = "Start writing your story...",
}: DualSidebarWritingInterfaceProps) {
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
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)

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

  const handleInsertText = (text: string) => {
    // This would integrate with the TiptapEditor to insert text at cursor position
    // In a real implementation, you'd use the editor's command API:
    // editor.commands.insertContent(text)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _unused = text
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
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          {/* Left Sidebar - Project Structure & Codex */}
          <Sidebar side="left" variant="sidebar">
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
                      <SidebarMenuButton>
                        <FileText />
                        <span>Outline</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <PenTool />
                        <span>Write</span>
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
          <SidebarInset className="flex flex-1 flex-col">
            {/* Header */}
            <header className="flex h-16 items-center justify-between border-b px-6">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-lg">{project.title}</h1>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-muted-foreground text-sm">
                  {project.currentWordCount.toLocaleString()} /{" "}
                  {project.targetWordCount?.toLocaleString() || "∞"} words
                </div>
                <Button
                  className="gap-2"
                  onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                  size="sm"
                  variant="outline"
                >
                  <MessageCircle className="h-4 w-4" />
                  {rightSidebarOpen ? "Hide AI" : "Show AI"}
                </Button>
              </div>
            </header>

            {/* Editor Content */}
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1">
                <TiptapEditor content={content} onUpdate={onUpdate} placeholder={placeholder} />
              </div>
            </div>
          </SidebarInset>

          {/* Right Sidebar - AI Assistant */}
          {rightSidebarOpen && (
            <div className="w-96 border-l bg-background">
              <div className="flex h-16 items-center justify-between border-b px-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">Writing Assistant</h3>
                    <p className="text-muted-foreground text-xs">AI-powered writing help</p>
                  </div>
                </div>
                <Button onClick={() => setRightSidebarOpen(false)} size="sm" variant="ghost">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-[calc(100vh-4rem)]">
                <AIChatContent onInsertText={handleInsertText} />
              </div>
            </div>
          )}
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
    </TooltipProvider>
  )
}
