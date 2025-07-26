import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ChevronRight, FileEdit, FileText, MapPin, PenTool, Scroll, Sparkles } from "lucide-react"
import { useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { AIChatContent } from "@/components/ai-chat-content"
import { AutocompleteToggle } from "@/components/autocomplete-toggle"
import { CharacterSidebarSection } from "@/components/character-sidebar-section"
import CodexModal from "@/components/codex-modal"
import TiptapEditor from "@/components/tiptap-editor"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Logo } from "@/components/ui/logo"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
import { useIsMobile } from "@/hooks/use-mobile"
import { api } from "@/lib/api"

interface DualSidebarWritingInterfaceProps {
  projectId: string
  content?: string
  onUpdate?: (content: string) => void
  placeholder?: string
}

// Inner component that has access to sidebar context
function DualSidebarWritingInterfaceInner({
  projectId,
  content = "",
  onUpdate,
  placeholder = "Write something beautiful...",
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

  // Separate state for right sidebar (AI chat) - independent from left sidebar
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const isMobile = useIsMobile()

  // Fetch project details
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const result = await api.projects.get(projectId)
      return result
    },
  })

  // Keyboard shortcut to toggle AI assistant
  useHotkeys(
    "cmd+j, ctrl+j",
    () => {
      setRightSidebarOpen((prev) => !prev)
    },
    {
      preventDefault: true,
      enableOnFormTags: false,
      enableOnContentEditable: false,
    }
  )

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

  const handleInsertText = (text: string) => {
    // This would integrate with the TiptapEditor to insert text at cursor position
    if (onUpdate) {
      onUpdate(content + text)
    }
  }

  // Mock data for locations (until backend is ready)
  const locations = [
    {
      id: "1",
      name: "The Dark Forest",
      type: "fantasy_realm" as const,
      description: "An ancient forest filled with magical creatures.",
    },
    {
      id: "2",
      name: "Crystal Cave",
      type: "building" as const,
      description: "Hidden cavern containing the ancient crystal.",
    },
  ]

  // Mock data for lore entries
  const loreEntries = [
    {
      id: "1",
      name: "Magic System",
      type: "core_rule",
      description: "Elemental magic drawn from nature's energy.",
    },
    {
      id: "2",
      name: "The Ancient Prophecy",
      type: "history",
      description: "Foretells the coming of a chosen one.",
    },
  ]

  // Mock data for plot threads
  const plotThreads = [
    {
      name: "Quest for the Crystal",
      role: "Main Plot",
      description: "The primary journey driving the story.",
    },
    {
      name: "Kellan's Secret Past",
      role: "Subplot",
      description: "Mysteries surrounding the mentor's history.",
    },
  ]

  // Mock data for notes
  const notes = [
    {
      name: "Chapter 3 Notes",
      role: "Notes",
      description: "Key points to remember for the forest scene.",
    },
    {
      name: "Character Arc Ideas",
      role: "Notes",
      description: "Development ideas for Aria's journey.",
    },
  ]

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

  return (
    <>
      {/* Left Sidebar - Navigation & Codex */}
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

          {/* Characters Section */}
          <CharacterSidebarSection
            isExpanded={expandedCodexSections.characters}
            onOpenCodexModal={openCodexModal}
            onToggle={() => toggleCodexSection("characters")}
            projectId={projectId}
          />

          {/* Locations Section */}
          <Collapsible
            onOpenChange={() => toggleCodexSection("locations")}
            open={expandedCodexSections.locations}
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="group/collapsible">
                  <MapPin className="h-4 w-4" />
                  Locations
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {locations.map((location) => (
                      <SidebarMenuItem key={location.id}>
                        <SidebarMenuButton
                          onClick={() => openCodexModal("locations", location.name)}
                        >
                          <span>{location.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          {/* Lore Section */}
          <Collapsible
            onOpenChange={() => toggleCodexSection("lore")}
            open={expandedCodexSections.lore}
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="group/collapsible">
                  <Scroll className="h-4 w-4" />
                  Lore & World-building
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {loreEntries.map((loreItem) => (
                      <SidebarMenuItem key={loreItem.id}>
                        <SidebarMenuButton onClick={() => openCodexModal("lore", loreItem.name)}>
                          <span>{loreItem.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          {/* Plot Section */}
          <Collapsible
            onOpenChange={() => toggleCodexSection("plot")}
            open={expandedCodexSections.plot}
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="group/collapsible">
                  <FileEdit className="h-4 w-4" />
                  Plot Threads
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {plotThreads.map((plotItem) => (
                      <SidebarMenuItem key={plotItem.name}>
                        <SidebarMenuButton onClick={() => openCodexModal("plot", plotItem.name)}>
                          <span>{plotItem.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          {/* Notes Section */}
          <Collapsible
            onOpenChange={() => toggleCodexSection("notes")}
            open={expandedCodexSections.notes}
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="group/collapsible">
                  <FileText className="h-4 w-4" />
                  Notes & Ideas
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {notes.map((note) => (
                      <SidebarMenuItem key={note.name}>
                        <SidebarMenuButton onClick={() => openCodexModal("notes", note.name)}>
                          <span>{note.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <UserMenu />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content Area */}
      <SidebarInset className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              params={{ projectId }}
              to="/projects/$projectId"
            >
              {project.title}
            </Link>
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
            <div className="flex items-center justify-start px-4 py-3">
              <div className="flex items-center gap-4 text-muted-foreground text-sm">
                <span>{content.split(" ").filter((word) => word.length > 0).length} words</span>
                <div className="h-4 w-px bg-border" />
                <span>
                  {Math.ceil(content.split(" ").filter((word) => word.length > 0).length / 200)} min
                  read
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
      {isMobile ? (
        <Sheet onOpenChange={setRightSidebarOpen} open={rightSidebarOpen}>
          <SheetContent className="w-[18rem] bg-background p-0" side="right">
            <SheetHeader className="sr-only">
              <SheetTitle>AI Writing Assistant</SheetTitle>
              <SheetDescription>AI-powered writing help and suggestions</SheetDescription>
            </SheetHeader>
            <div className="flex h-16 items-center gap-2 border-b px-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Writing Assistant</h3>
                <p className="text-muted-foreground text-xs">AI-powered writing help</p>
              </div>
            </div>
            <div className="h-[calc(100vh-4rem)]">
              <AIChatContent onInsertText={handleInsertText} />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        rightSidebarOpen && (
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
            </div>
            <div className="h-[calc(100vh-4rem)]">
              <AIChatContent onInsertText={handleInsertText} />
            </div>
          </div>
        )
      )}

      {/* Codex Modal */}
      <CodexModal
        initialEntry={codexModalConfig.initialEntry}
        initialType={codexModalConfig.initialType}
        isOpen={isCodexModalOpen}
        onClose={closeCodexModal}
        projectId={projectId}
      />
    </>
  )
}

// Main component that provides the sidebar context
export function DualSidebarWritingInterface(props: DualSidebarWritingInterfaceProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <DualSidebarWritingInterfaceInner {...props} />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
