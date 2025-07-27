import { Link } from "@tanstack/react-router"
import { ChevronDown, ChevronRight, FileText, PenTool, Plus, Scroll } from "lucide-react"
import { useState } from "react"
import { CharacterSidebarSection } from "@/components/character-sidebar-section"
import CodexModal from "@/components/codex-modal"
import { LocationSidebarSection } from "@/components/location-sidebar-section"
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import UserMenu from "@/components/user-menu"

interface ProjectSidebarProps {
  projectId: string
}

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
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

  // Mock data for codex sections
  const loreEntries = [
    { id: "1", name: "Magic System", type: "Core Rule" },
    { id: "2", name: "Ancient History", type: "History" },
  ]

  const plotThreads = [
    { name: "Hero's Journey", role: "Main Plot" },
    { name: "Romance Subplot", role: "Secondary" },
  ]

  const notes = [
    { name: "Chapter Ideas", role: "Planning" },
    { name: "Research Notes", role: "Reference" },
  ]

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

  return (
    <>
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
                  <SidebarMenuButton asChild>
                    <Link params={{ projectId }} to="/projects/$projectId/canvas">
                      <FileText />
                      <span>Canvas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link params={{ projectId }} to="/projects/$projectId/write">
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
                <CharacterSidebarSection
                  isExpanded={expandedCodexSections.characters}
                  key="characters-section"
                  onOpenCodexModal={openCodexModal}
                  onToggle={() => toggleCodexSection("characters")}
                  projectId={projectId}
                />

                {/* Locations */}
                <LocationSidebarSection
                  isExpanded={expandedCodexSections.locations}
                  key="locations-section"
                  onOpenCodexModal={openCodexModal}
                  onToggle={() => toggleCodexSection("locations")}
                  projectId={projectId}
                />

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
                          {loreEntries.length}
                        </Badge>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-6 space-y-1">
                        <Button
                          className="w-full justify-start text-muted-foreground"
                          onClick={() => openCodexModal("lore")}
                          size="sm"
                          variant="ghost"
                        >
                          <Plus className="h-4 w-4" />
                          <span>New</span>
                        </Button>
                        {loreEntries.map((loreItem) => (
                          <Button
                            className="w-full justify-start"
                            key={loreItem.id}
                            onClick={() => openCodexModal("lore", loreItem.name)}
                            size="sm"
                            variant="ghost"
                          >
                            <span className="truncate">{loreItem.name}</span>
                            <span className="ml-auto text-muted-foreground text-xs">
                              {loreItem.type}
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
                          {plotThreads.length}
                        </Badge>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-6 space-y-1">
                        <Button
                          className="w-full justify-start text-muted-foreground"
                          onClick={() => openCodexModal("plot")}
                          size="sm"
                          variant="ghost"
                        >
                          <Plus className="h-4 w-4" />
                          <span>New</span>
                        </Button>
                        {plotThreads.map((plotItem) => (
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
                        <FileText className="h-4 w-4" />
                        <span>Notes & Ideas</span>
                        <Badge className="ml-auto" variant="secondary">
                          {notes.length}
                        </Badge>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-6 space-y-1">
                        <Button
                          className="w-full justify-start text-muted-foreground"
                          onClick={() => openCodexModal("notes")}
                          size="sm"
                          variant="ghost"
                        >
                          <Plus className="h-4 w-4" />
                          <span>New</span>
                        </Button>
                        {notes.map((note) => (
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
          <SidebarMenu>
            <SidebarMenuItem>
              <UserMenu />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Codex Modal */}
      <CodexModal
        initialEntry={codexModalConfig.initialEntry}
        initialType={codexModalConfig.initialType}
        isOpen={isCodexModalOpen}
        onClose={() => setIsCodexModalOpen(false)}
        projectId={projectId}
      />
    </>
  )
}
