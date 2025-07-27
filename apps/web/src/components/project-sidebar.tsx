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

interface CollapsibleSectionProps {
  sectionKey: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  items: Array<{ id: string; name: string; role?: string; type?: string }>
  isExpanded: boolean
  onToggle: () => void
  onOpenModal: (type: string, entry?: string) => void
  secondaryField: "role" | "type"
}

function CollapsibleSection({
  sectionKey,
  icon: Icon,
  title,
  items,
  isExpanded,
  onToggle,
  onOpenModal,
  secondaryField,
}: CollapsibleSectionProps) {
  return (
    <SidebarMenuItem>
      <Collapsible onOpenChange={onToggle} open={isExpanded}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Icon className="h-4 w-4" />
            <span>{title}</span>
            <Badge className="ml-auto" variant="secondary">
              {items.length}
            </Badge>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-6 space-y-1">
            <Button
              className="w-full justify-start text-muted-foreground"
              onClick={() => onOpenModal(sectionKey)}
              size="sm"
              variant="ghost"
            >
              <Plus className="h-4 w-4" />
              <span>New</span>
            </Button>
            {items.map((item) => (
              <Button
                className="w-full justify-start"
                key={item.id}
                onClick={() => onOpenModal(sectionKey, item.name)}
                size="sm"
                variant="ghost"
              >
                <span className="truncate">{item.name}</span>
                <span className="ml-auto text-muted-foreground text-xs">
                  {item[secondaryField]}
                </span>
              </Button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
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
    { id: "1", name: "Hero's Journey", role: "Main Plot" },
    { id: "2", name: "Romance Subplot", role: "Secondary" },
  ]

  const notes = [
    { id: "1", name: "Chapter Ideas", role: "Planning" },
    { id: "2", name: "Research Notes", role: "Reference" },
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
                <CollapsibleSection
                  icon={Scroll}
                  isExpanded={expandedCodexSections.lore}
                  items={loreEntries}
                  onOpenModal={openCodexModal}
                  onToggle={() => toggleCodexSection("lore")}
                  secondaryField="type"
                  sectionKey="lore"
                  title="Lore"
                />

                {/* Plot Threads */}
                <CollapsibleSection
                  icon={FileText}
                  isExpanded={expandedCodexSections.plot}
                  items={plotThreads}
                  onOpenModal={openCodexModal}
                  onToggle={() => toggleCodexSection("plot")}
                  secondaryField="role"
                  sectionKey="plot"
                  title="Plot Threads"
                />

                {/* Notes */}
                <CollapsibleSection
                  icon={FileText}
                  isExpanded={expandedCodexSections.notes}
                  items={notes}
                  onOpenModal={openCodexModal}
                  onToggle={() => toggleCodexSection("notes")}
                  secondaryField="role"
                  sectionKey="notes"
                  title="Notes & Ideas"
                />
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
        onClose={() => {
          setIsCodexModalOpen(false)
          setCodexModalConfig({})
        }}
        projectId={projectId}
      />
    </>
  )
}
