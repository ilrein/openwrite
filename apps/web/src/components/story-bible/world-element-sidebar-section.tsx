import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, Edit, Globe, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { WorldElementDialog } from "@/components/story-bible/world-element-dialog"
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
import { storyBibleApi, WORLD_ELEMENT_TYPE_OPTIONS, type WorldElement } from "@/lib/api"

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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [selected, setSelected] = useState<WorldElement | null>(null)

  const { data: elements = [] } = useQuery({
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

  const openCreate = () => {
    setSelected(null)
    setDialogMode("create")
    setDialogOpen(true)
  }

  const openEdit = (element: WorldElement) => {
    setSelected(element)
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
                className="w-full justify-start text-muted-foreground"
                onClick={openCreate}
                size="sm"
                variant="ghost"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </Button>
              {elements.map((element) => (
                <ContextMenu key={element.id}>
                  <ContextMenuTrigger asChild>
                    <Button
                      className="w-full justify-start"
                      onClick={() => openEdit(element)}
                      size="sm"
                      variant="ghost"
                    >
                      <span className="truncate">{element.name}</span>
                      <span className="ml-auto text-muted-foreground text-xs">
                        {typeLabel(element.type)}
                      </span>
                    </Button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => openEdit(element)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </ContextMenuItem>
                    <ContextMenuSeparator />
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

      <WorldElementDialog
        element={selected}
        mode={dialogMode}
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        projectId={projectId}
      />
    </>
  )
}
