import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ChevronDown, ChevronRight, Plus, StickyNote, Trash2 } from "lucide-react"
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

interface NoteSidebarSectionProps {
  isExpanded: boolean
  onToggle: () => void
  projectId: string
}

/** Replaces the old, non-functional "Notes & Ideas" — real notes you write and store. */
export function NoteSidebarSection({ projectId, isExpanded, onToggle }: NoteSidebarSectionProps) {
  const queryClient = useQueryClient()

  const {
    data: notes = [],
    isError,
    error,
  } = useQuery({
    queryKey: ["notes", projectId],
    queryFn: () => storyBibleApi.notes.list(projectId),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storyBibleApi.notes.delete(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", projectId] })
      toast.success("Note deleted")
    },
    onError: () => toast.error("Failed to delete note"),
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
            <StickyNote className="h-4 w-4" />
            <span>Notes</span>
            <Badge className="ml-auto" variant="secondary">
              {notes.length}
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
                params={{ projectId, noteId: "new" }}
                to="/projects/$projectId/story-bible/note/$noteId"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </Link>
            </Button>
            {isError && (
              <p className="px-2 text-destructive text-xs">
                Couldn't load notes: {error instanceof Error ? error.message : "unknown error"}
              </p>
            )}
            {notes.map((note) => (
              <ContextMenu key={note.id}>
                <ContextMenuTrigger asChild>
                  <Button asChild className="w-full justify-start" size="sm" variant="ghost">
                    <Link
                      params={{ projectId, noteId: note.id }}
                      to="/projects/$projectId/story-bible/note/$noteId"
                    >
                      <span className="truncate">{note.title}</span>
                    </Link>
                  </Button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => deleteMutation.mutate(note.id)}
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
