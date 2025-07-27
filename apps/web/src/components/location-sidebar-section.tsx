import { useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, Edit, FileText, MapPin, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { DeleteLocationDialog } from "@/components/delete-location-dialog"
import { LocationDialog } from "@/components/location-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { api, type Location } from "@/lib/api"

interface LocationSidebarSectionProps {
  projectId: string
  isExpanded: boolean
  onToggle: () => void
  onOpenCodexModal: (type: string, entry: string) => void
}

export function LocationSidebarSection({
  projectId,
  isExpanded,
  onToggle,
  onOpenCodexModal,
}: LocationSidebarSectionProps) {
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [locationDialogMode, setLocationDialogMode] = useState<"create" | "edit">("create")
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [deleteLocationDialogOpen, setDeleteLocationDialogOpen] = useState(false)

  // Fetch locations
  const {
    data: locations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["locations", projectId],
    queryFn: async () => {
      const result = await api.locations.list(projectId)
      return result
    },
  })

  const handleCreateLocation = () => {
    setSelectedLocation(null)
    setLocationDialogMode("create")
    setLocationDialogOpen(true)
  }

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location)
    setLocationDialogMode("edit")
    setLocationDialogOpen(true)
  }

  const handleDeleteLocation = (location: Location) => {
    setSelectedLocation(location)
    setDeleteLocationDialogOpen(true)
  }

  return (
    <>
      <SidebarMenuItem>
        <Collapsible
          onOpenChange={(open) => {
            console.log("LocationSidebarSection Collapsible onOpenChange:", open)
            onToggle()
          }}
          open={isExpanded}
        >
          <CollapsibleTrigger asChild>
            <SidebarMenuButton onClick={() => console.log("LocationSidebarSection button clicked")}>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <MapPin className="h-4 w-4" />
              <span>Locations</span>
              <Badge className="ml-auto" variant="secondary">
                {locations.length}
              </Badge>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="ml-6 space-y-1">
              <Button
                className="w-full justify-start text-muted-foreground"
                onClick={handleCreateLocation}
                size="sm"
                variant="ghost"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </Button>
              {locations.map((location) => (
                <ContextMenu key={location.id}>
                  <ContextMenuTrigger asChild>
                    <Button
                      className="w-full justify-start"
                      onClick={() => onOpenCodexModal("locations", location.name)}
                      size="sm"
                      variant="ghost"
                    >
                      <span className="truncate">{location.name}</span>
                      {/* Type display removed - no longer showing location.type */}
                    </Button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => onOpenCodexModal("locations", location.name)}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Details
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleEditLocation(location)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Location
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteLocation(location)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Location
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>

      {/* Location Dialog */}
      <LocationDialog
        location={selectedLocation}
        mode={locationDialogMode}
        onOpenChange={setLocationDialogOpen}
        open={locationDialogOpen}
        projectId={projectId}
      />

      {/* Delete Location Dialog */}
      {selectedLocation && (
        <DeleteLocationDialog
          location={selectedLocation}
          onOpenChange={setDeleteLocationDialogOpen}
          open={deleteLocationDialogOpen}
          projectId={projectId}
        />
      )}
    </>
  )
}
