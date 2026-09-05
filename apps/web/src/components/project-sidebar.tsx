import { Link } from "@tanstack/react-router"
import { Feather, FileText, NotebookPen, PenTool } from "lucide-react"
import { useState } from "react"
import { CharacterSidebarSection } from "@/components/character-sidebar-section"
import { LocationSidebarSection } from "@/components/location-sidebar-section"
import { CharacterGroupSidebarSection } from "@/components/story-bible/character-group-sidebar-section"
import { LoreSidebarSection } from "@/components/story-bible/lore-sidebar-section"
import { NoteSidebarSection } from "@/components/story-bible/note-sidebar-section"
import { PlotSidebarSection } from "@/components/story-bible/plot-sidebar-section"
import { WorldElementSidebarSection } from "@/components/story-bible/world-element-sidebar-section"
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

const INITIAL_EXPANDED = {
  characters: false,
  groups: false,
  worldbuilding: false,
  notes: false,
  locations: false,
  lore: false,
  plot: false,
}

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const [expandedSections, setExpandedSections] =
    useState<Record<string, boolean>>(INITIAL_EXPANDED)

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
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
                  <Link params={{ projectId }} to="/projects/$projectId/write">
                    <PenTool />
                    <span>Write</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link params={{ projectId }} to="/projects/$projectId/canvas">
                    <FileText />
                    <span>Canvas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Story Bible</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link params={{ projectId }} to="/projects/$projectId/story-bible/style">
                    <Feather className="h-4 w-4" />
                    <span>Style</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link params={{ projectId }} to="/projects/$projectId/story-bible/braindump">
                    <NotebookPen className="h-4 w-4" />
                    <span>Braindump</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <CharacterSidebarSection
                isExpanded={expandedSections.characters}
                key="characters-section"
                onToggle={() => toggleSection("characters")}
                projectId={projectId}
              />

              <CharacterGroupSidebarSection
                isExpanded={expandedSections.groups}
                key="character-groups-section"
                onToggle={() => toggleSection("groups")}
                projectId={projectId}
              />

              <WorldElementSidebarSection
                isExpanded={expandedSections.worldbuilding}
                key="worldbuilding-section"
                onToggle={() => toggleSection("worldbuilding")}
                projectId={projectId}
              />

              <LocationSidebarSection
                isExpanded={expandedSections.locations}
                key="locations-section"
                onToggle={() => toggleSection("locations")}
                projectId={projectId}
              />

              <LoreSidebarSection
                isExpanded={expandedSections.lore}
                key="lore-section"
                onToggle={() => toggleSection("lore")}
                projectId={projectId}
              />

              <PlotSidebarSection
                isExpanded={expandedSections.plot}
                key="plot-section"
                onToggle={() => toggleSection("plot")}
                projectId={projectId}
              />

              <NoteSidebarSection
                isExpanded={expandedSections.notes}
                key="notes-section"
                onToggle={() => toggleSection("notes")}
                projectId={projectId}
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
  )
}
