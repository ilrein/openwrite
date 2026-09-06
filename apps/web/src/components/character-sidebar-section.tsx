import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ChevronDown, ChevronRight, Plus, Trash2, Users } from "lucide-react"
import { useState } from "react"
import { DeleteCharacterDialog } from "@/components/delete-character-dialog"
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
import { api, type Character } from "@/lib/api"

interface CharacterSidebarSectionProps {
  isExpanded: boolean
  onToggle: () => void
  projectId: string
}

export function CharacterSidebarSection({
  projectId,
  isExpanded,
  onToggle,
}: CharacterSidebarSectionProps) {
  const [deletingCharacter, setDeletingCharacter] = useState<Character | null>(null)

  const { data: characters = [] } = useQuery({
    queryKey: ["characters", projectId],
    queryFn: () => api.characters.list(projectId),
  })

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
              <Users className="h-4 w-4" />
              <span>Characters</span>
              <Badge className="ml-auto" variant="secondary">
                {characters.length}
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
                  params={{ projectId, characterId: "new" }}
                  to="/projects/$projectId/story-bible/character/$characterId"
                >
                  <Plus className="h-4 w-4" />
                  <span>New</span>
                </Link>
              </Button>
              {characters.map((character) => (
                <ContextMenu key={character.id}>
                  <ContextMenuTrigger asChild>
                    <Button asChild className="w-full justify-start" size="sm" variant="ghost">
                      <Link
                        params={{ projectId, characterId: character.id }}
                        to="/projects/$projectId/story-bible/character/$characterId"
                      >
                        <span className="truncate">{character.name}</span>
                      </Link>
                    </Button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeletingCharacter(character)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Character
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuItem>

      {deletingCharacter && (
        <DeleteCharacterDialog
          character={deletingCharacter}
          onOpenChange={(open) => !open && setDeletingCharacter(null)}
          open={Boolean(deletingCharacter)}
          projectId={projectId}
        />
      )}
    </>
  )
}
