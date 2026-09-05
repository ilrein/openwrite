import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ChevronDown, ChevronRight, Plus, Trash2, Users2 } from "lucide-react"
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
import { storyBibleApi } from "@/lib/api"

interface CharacterGroupSidebarSectionProps {
  isExpanded: boolean
  onToggle: () => void
  projectId: string
}

export function CharacterGroupSidebarSection({
  projectId,
  isExpanded,
  onToggle,
}: CharacterGroupSidebarSectionProps) {
  const queryClient = useQueryClient()

  const {
    data: groups = [],
    isError,
    error,
  } = useQuery({
    queryKey: ["character-groups", projectId],
    queryFn: () => storyBibleApi.characterGroups.list(projectId),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storyBibleApi.characterGroups.delete(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character-groups", projectId] })
      toast.success("Group deleted")
    },
    onError: () => toast.error("Failed to delete group"),
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
            <Users2 className="h-4 w-4" />
            <span>Character Groups</span>
            <Badge className="ml-auto" variant="secondary">
              {groups.length}
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
                params={{ projectId, groupId: "new" }}
                to="/projects/$projectId/story-bible/group/$groupId"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </Link>
            </Button>
            {isError && (
              <p className="px-2 text-destructive text-xs">
                Couldn't load groups: {error instanceof Error ? error.message : "unknown error"}
              </p>
            )}
            {groups.map((group) => (
              <ContextMenu key={group.id}>
                <ContextMenuTrigger asChild>
                  <Button asChild className="w-full justify-start" size="sm" variant="ghost">
                    <Link
                      params={{ projectId, groupId: group.id }}
                      to="/projects/$projectId/story-bible/group/$groupId"
                    >
                      <span className="truncate">{group.name}</span>
                      <span className="ml-auto text-muted-foreground text-xs">
                        {group.memberIds.length}
                      </span>
                    </Link>
                  </Button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => deleteMutation.mutate(group.id)}
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
