import { useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, Edit, FileText, Plus, Trash2, Users } from "lucide-react"
import { useState } from "react"
import { CharacterDialog } from "@/components/character-dialog"
import { DeleteCharacterDialog } from "@/components/delete-character-dialog"
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
import { api, type Character } from "@/lib/api"

interface CharacterSidebarSectionProps {
  projectId: string
  isExpanded: boolean
  onToggle: () => void
  onOpenCodexModal: (type: string, entry: string) => void
}

export function CharacterSidebarSection({
  projectId,
  isExpanded,
  onToggle,
  onOpenCodexModal,
}: CharacterSidebarSectionProps) {
  const [characterDialogOpen, setCharacterDialogOpen] = useState(false)
  const [characterDialogMode, setCharacterDialogMode] = useState<"create" | "edit">("create")
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [deleteCharacterDialogOpen, setDeleteCharacterDialogOpen] = useState(false)

  // Fetch characters
  const { data: characters = [] } = useQuery({
    queryKey: ["characters", projectId],
    queryFn: async () => {
      const result = await api.characters.list(projectId)
      return result
    },
  })

  const handleCreateCharacter = () => {
    setSelectedCharacter(null)
    setCharacterDialogMode("create")
    setCharacterDialogOpen(true)
  }

  const handleEditCharacter = (character: Character) => {
    setSelectedCharacter(character)
    setCharacterDialogMode("edit")
    setCharacterDialogOpen(true)
  }

  const handleDeleteCharacter = (character: Character) => {
    setSelectedCharacter(character)
    setDeleteCharacterDialogOpen(true)
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
                className="w-full justify-start text-muted-foreground"
                onClick={handleCreateCharacter}
                size="sm"
                variant="ghost"
              >
                <Plus className="h-4 w-4" />
                <span>New</span>
              </Button>
              {characters.map((character) => (
                <ContextMenu key={character.id}>
                  <ContextMenuTrigger asChild>
                    <Button
                      className="w-full justify-start"
                      onClick={() => onOpenCodexModal("characters", character.name)}
                      size="sm"
                      variant="ghost"
                    >
                      <span className="truncate">{character.name}</span>
                      {/* Role display removed - no longer showing character.role */}
                    </Button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => onOpenCodexModal("characters", character.name)}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Details
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleEditCharacter(character)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Character
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDeleteCharacter(character)}
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

      {/* Character Dialog */}
      <CharacterDialog
        character={selectedCharacter}
        mode={characterDialogMode}
        onOpenChange={setCharacterDialogOpen}
        open={characterDialogOpen}
        projectId={projectId}
      />

      {/* Delete Character Dialog */}
      {selectedCharacter && (
        <DeleteCharacterDialog
          character={selectedCharacter}
          onOpenChange={setDeleteCharacterDialogOpen}
          open={deleteCharacterDialogOpen}
          projectId={projectId}
        />
      )}
    </>
  )
}
