import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ChevronDown, ChevronRight, GitBranch, Plus, Trash2 } from "lucide-react"
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

interface PlotSidebarSectionProps {
  isExpanded: boolean
  onToggle: () => void
  projectId: string
}

export function PlotSidebarSection({ projectId, isExpanded, onToggle }: PlotSidebarSectionProps) {
  const queryClient = useQueryClient()

  const {
    data: threads = [],
    isError,
    error,
  } = useQuery({
    queryKey: ["plot", projectId],
    queryFn: () => api.plot.list(projectId),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.plot.delete(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plot", projectId] })
      toast.success("Plot thread deleted")
    },
    onError: () => toast.error("Failed to delete plot thread"),
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
            <GitBranch className="h-4 w-4" />
            <span>Plot Threads</span>
            <Badge className="ml-auto" variant="secondary">
              {threads.length}
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
                params={{ projectId, plotId: "new" }}
                to="/projects/$projectId/story-bible/plot/$plotId"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </Link>
            </Button>
            {isError && (
              <p className="px-2 text-destructive text-xs">
                Couldn't load plot threads:{" "}
                {error instanceof Error ? error.message : "unknown error"}
              </p>
            )}
            {threads.map((thread) => (
              <ContextMenu key={thread.id}>
                <ContextMenuTrigger asChild>
                  <Button asChild className="w-full justify-start" size="sm" variant="ghost">
                    <Link
                      params={{ projectId, plotId: thread.id }}
                      to="/projects/$projectId/story-bible/plot/$plotId"
                    >
                      <span className="truncate">{thread.title}</span>
                    </Link>
                  </Button>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => deleteMutation.mutate(thread.id)}
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
