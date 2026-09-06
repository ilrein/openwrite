import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ChevronDown, ChevronRight, MapPin, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { api } from "@/lib/api"

interface LocationSidebarSectionProps {
  isExpanded: boolean
  onToggle: () => void
  projectId: string
}

export function LocationSidebarSection({
  projectId,
  isExpanded,
  onToggle,
}: LocationSidebarSectionProps) {
  const queryClient = useQueryClient()

  const {
    data: locations = [],
    isError,
    error,
  } = useQuery({
    queryKey: ["locations", projectId],
    queryFn: () => api.locations.list(projectId),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.locations.delete(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", projectId] })
      toast.success("Location deleted")
    },
    onError: () => toast.error("Failed to delete location"),
  })

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
              asChild
              className="w-full justify-start text-muted-foreground"
              size="sm"
              variant="ghost"
            >
              <Link
                params={{ projectId, locationId: "new" }}
                to="/projects/$projectId/story-bible/location/$locationId"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </Link>
            </Button>
            {isError && (
              <p className="px-2 text-destructive text-xs">
                Couldn't load locations: {error instanceof Error ? error.message : "unknown error"}
              </p>
            )}
            {locations.map((location) => (
              <ContextMenu key={location.id}>
                <ContextMenuTrigger asChild>
                  <Button asChild className="w-full justify-start" size="sm" variant="ghost">
                    <Link
                      params={{ projectId, locationId: location.id }}
                      to="/projects/$projectId/story-bible/location/$locationId"
                    >
                      <span className="truncate">{location.name}</span>
                    </Link>
                  </Button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => deleteMutation.mutate(location.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}
