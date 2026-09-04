import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, Edit, Plus, Trash2, Users2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { CharacterGroupDialog } from "@/components/story-bible/character-group-dialog"
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
import { type CharacterGroup, storyBibleApi } from "@/lib/api"

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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [selected, setSelected] = useState<CharacterGroup | null>(null)

  const { data: groups = [] } = useQuery({
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

  const openCreate = () => {
    setSelected(null)
    setDialogMode("create")
    setDialogOpen(true)
  }

  const openEdit = (group: CharacterGroup) => {
    setSelected(group)
    setDialogMode("edit")
    setDialogOpen(true)
  }

  return (
    <>
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
                className="w-full justify-start text-muted-foreground"
                onClick={openCreate}
                size="sm"
                variant="ghost"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </Button>
              {groups.map((group) => (
                <ContextMenu key={group.id}>
                  <ContextMenuTrigger asChild>
                    <Button
                      className="w-full justify-start"
                      onClick={() => openEdit(group)}
                      size="sm"
                      variant="ghost"
                    >
                      <span className="truncate">{group.name}</span>
                      <span className="ml-auto text-muted-foreground text-xs">
                        {group.memberIds.length}
                      </span>
                    </Button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => openEdit(group)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </ContextMenuItem>
                    <ContextMenuSeparator />
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

      <CharacterGroupDialog
        group={selected}
        mode={dialogMode}
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        projectId={projectId}
      />
    </>
  )
}
