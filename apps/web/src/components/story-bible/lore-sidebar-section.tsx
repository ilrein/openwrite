import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ChevronDown, ChevronRight, Plus, Scroll, Trash2 } from "lucide-react"
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

interface LoreSidebarSectionProps {
  isExpanded: boolean
  onToggle: () => void
  projectId: string
}

export function LoreSidebarSection({ projectId, isExpanded, onToggle }: LoreSidebarSectionProps) {
  const queryClient = useQueryClient()

  const {
    data: entries = [],
    isError,
    error,
  } = useQuery({
    queryKey: ["lore", projectId],
    queryFn: () => api.lore.list(projectId),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.lore.delete(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lore", projectId] })
      toast.success("Lore entry deleted")
    },
    onError: () => toast.error("Failed to delete lore entry"),
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
            <Scroll className="h-4 w-4" />
            <span>Lore</span>
            <Badge className="ml-auto" variant="secondary">
              {entries.length}
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
                params={{ projectId, loreId: "new" }}
                to="/projects/$projectId/story-bible/lore/$loreId"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </Link>
            </Button>
            {isError && (
              <p className="px-2 text-destructive text-xs">
                Couldn't load lore: {error instanceof Error ? error.message : "unknown error"}
              </p>
            )}
            {entries.map((lore) => (
              <ContextMenu key={lore.id}>
                <ContextMenuTrigger asChild>
                  <Button asChild className="w-full justify-start" size="sm" variant="ghost">
                    <Link
                      params={{ projectId, loreId: lore.id }}
                      to="/projects/$projectId/story-bible/lore/$loreId"
                    >
                      <span className="truncate">{lore.name}</span>
                    </Link>
                  </Button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => deleteMutation.mutate(lore.id)}
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
