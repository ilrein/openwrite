import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
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
} from "lucide-react"
import { useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { AIChatContent } from "@/components/ai-chat-content"
import { AutocompleteToggle } from "@/components/autocomplete-toggle"
import { CharacterSidebarSection } from "@/components/character-sidebar-section"
import CodexModal from "@/components/codex-modal"
import TiptapEditor from "@/components/tiptap-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Logo } from "@/components/ui/logo"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import UserMenu from "@/components/user-menu"
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
    notes: false,
  })
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)

  // Keyboard shortcut to toggle AI assistant
  useHotkeys(
    "cmd+j, ctrl+j",
    () => {
      setRightSidebarOpen((prev) => !prev)
    },
    {
      preventDefault: true,
      enableOnFormTags: false, // Don't trigger when typing in inputs
      enableOnContentEditable: false, // Don't trigger in editor
    }
  )

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
  const _progressPercentage = targetWordCount
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
    notes: [
      { name: "Character Development Ideas", role: "Creative Note" },
      { name: "Plot Holes to Fix", role: "Revision Note" },
      { name: "Research: Medieval Weapons", role: "Research Note" },
    ],
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          {/* Left Sidebar - OpenWrite Logo & Navigation */}
          <Sidebar side="left" variant="sidebar">
            <SidebarHeader>
              <div className="px-4 py-3">
                <Logo size="md" to="/dashboard" />
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
                    <CharacterSidebarSection
                      isExpanded={expandedCodexSections.characters}
                      onOpenCodexModal={openCodexModal}
                      onToggle={() => toggleCodexSection("characters")}
                      projectId={projectId}
                    />

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

                    {/* Plot */}
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
                            <span>Plot</span>
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

                    {/* Notes */}
                    <SidebarMenuItem>
                      <Collapsible
                        onOpenChange={() => toggleCodexSection("notes")}
                        open={expandedCodexSections.notes}
                      >
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            {expandedCodexSections.notes ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <FileEdit className="h-4 w-4" />
                            <span>Notes</span>
                            <Badge className="ml-auto" variant="secondary">
                              {codexData.notes.length}
                            </Badge>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-6 space-y-1">
                            {codexData.notes.map((note) => (
                              <Button
                                className="w-full justify-start"
                                key={note.name}
                                onClick={() => openCodexModal("notes", note.name)}
                                size="sm"
                                variant="ghost"
                              >
                                <span className="truncate">{note.name}</span>
                                <span className="ml-auto text-muted-foreground text-xs">
                                  {note.role}
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
              <div className="p-2">
                <UserMenu />
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
                  <Link
                    className="hover:underline"
                    params={{ projectId }}
                    to="/projects/$projectId"
                  >
                    <h1 className="font-semibold text-lg">{project.title}</h1>
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-muted-foreground text-sm">
                  {project.currentWordCount.toLocaleString()} /{" "}
                  {project.targetWordCount?.toLocaleString() || "∞"} words
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="h-9 w-9 p-0 transition-colors"
                      onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                      size="sm"
                      variant={rightSidebarOpen ? "default" : "outline"}
                    >
                      <Sparkles
                        className={`h-4 w-4 ${rightSidebarOpen ? "text-primary-foreground" : "text-muted-foreground"}`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>AI Assistant {rightSidebarOpen ? "(Active)" : ""} • Cmd+J</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </header>

            {/* Editor Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-auto">
                <TiptapEditor content={content} onUpdate={onUpdate} placeholder={placeholder} />
              </div>

              {/* Writing Stats Footer */}
              <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div
                  className={`flex items-center justify-start py-3 ${rightSidebarOpen ? "px-4" : "px-6"}`}
                >
                  {/* Document Stats and Autocomplete Toggle */}
                  <div
                    className={`flex items-center text-muted-foreground text-sm ${rightSidebarOpen ? "gap-4" : "gap-6"}`}
                  >
                    <span>{content.split(" ").filter((word) => word.length > 0).length} words</span>
                    <div className="h-4 w-px bg-border" />
                    <span>
                      {Math.ceil(content.split(" ").filter((word) => word.length > 0).length / 200)}{" "}
                      min read
                    </span>
                    <div className="h-4 w-px bg-border" />
                    <span>
                      Auto-saved{" "}
                      {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className="h-4 w-px bg-border" />
                    <AutocompleteToggle />
                  </div>
                </div>
              </footer>
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
