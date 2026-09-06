import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ChevronDown, ChevronRight, Globe, Plus, Trash2 } from "lucide-react"
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
import { storyBibleApi, WORLD_ELEMENT_TYPE_OPTIONS } from "@/lib/api"

interface WorldElementSidebarSectionProps {
  isExpanded: boolean
  onToggle: () => void
  projectId: string
}

const typeLabel = (value: string) =>
  WORLD_ELEMENT_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value

export function WorldElementSidebarSection({
  projectId,
  isExpanded,
  onToggle,
}: WorldElementSidebarSectionProps) {
  const queryClient = useQueryClient()

  const {
    data: elements = [],
    isError,
    error,
  } = useQuery({
    queryKey: ["world-elements", projectId],
    queryFn: () => storyBibleApi.worldElements.list(projectId),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storyBibleApi.worldElements.delete(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-elements", projectId] })
      toast.success("Element deleted")
    },
    onError: () => toast.error("Failed to delete element"),
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
            <Globe className="h-4 w-4" />
            <span>Worldbuilding</span>
            <Badge className="ml-auto" variant="secondary">
              {elements.length}
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
                params={{ projectId, worldId: "new" }}
                to="/projects/$projectId/story-bible/world/$worldId"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </Link>
            </Button>
            {isError && (
              <p className="px-2 text-destructive text-xs">
                Couldn't load worldbuilding:{" "}
                {error instanceof Error ? error.message : "unknown error"}
              </p>
            )}
            {elements.map((element) => (
              <ContextMenu key={element.id}>
                <ContextMenuTrigger asChild>
                  <Button asChild className="w-full justify-start" size="sm" variant="ghost">
                    <Link
                      params={{ projectId, worldId: element.id }}
                      to="/projects/$projectId/story-bible/world/$worldId"
                    >
                      <span className="truncate">{element.name}</span>
                      <span className="ml-auto text-muted-foreground text-xs">
                        {typeLabel(element.type)}
                      </span>
                    </Link>
                  </Button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => deleteMutation.mutate(element.id)}
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
