import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { StoryBiblePageHeader } from "@/components/story-bible/page-header"
import { TraitEditor } from "@/components/story-bible/trait-editor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  api,
  CHARACTER_DEFAULT_TRAIT_LABELS,
  CHARACTER_ROLE_OPTIONS,
  type CharacterRole,
  storyBibleApi,
  type Trait,
  traitsFromLabels,
} from "@/lib/api"

export const Route = createFileRoute("/projects/$projectId/story-bible/character/$characterId")({
  component: CharacterPage,
})

const NO_ROLE = "none"

function CharacterPage() {
  const { projectId, characterId } = Route.useParams()
  const isNew = characterId === "new"
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: character, isLoading } = useQuery({
    queryKey: ["character", projectId, characterId],
    queryFn: () => api.characters.get(projectId, characterId),
    enabled: !isNew,
  })

  const [name, setName] = useState("")
  const [role, setRole] = useState<CharacterRole | typeof NO_ROLE>(NO_ROLE)
  const [description, setDescription] = useState("")
  const [traits, setTraits] = useState<Trait[]>(traitsFromLabels(CHARACTER_DEFAULT_TRAIT_LABELS))

  useEffect(() => {
    if (character) {
      setName(character.name)
      setRole(character.role ?? NO_ROLE)
      setDescription(character.description ?? "")
      setTraits(
        character.traits && character.traits.length > 0
          ? character.traits
          : traitsFromLabels(CHARACTER_DEFAULT_TRAIT_LABELS)
      )
    }
  }, [character])

  const goToManuscript = () => navigate({ to: "/projects/$projectId/write", params: { projectId } })

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ["characters", projectId] })

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        role: role === NO_ROLE ? null : role,
        traits: traits.filter((trait) => trait.label.trim()),
      }
      if (isNew) {
        return api.characters.create(projectId, payload)
      }
      return api.characters.update(projectId, characterId, payload)
    },
    onSuccess: (result) => {
      invalidateList()
      toast.success(isNew ? "Character created" : "Character saved")
      if (isNew && result && "id" in result) {
        navigate({
          to: "/projects/$projectId/story-bible/character/$characterId",
          params: { projectId, characterId: result.id },
          replace: true,
        })
      } else {
        queryClient.invalidateQueries({ queryKey: ["character", projectId, characterId] })
      }
    },
    onError: (error: Error) => toast.error(`Couldn't save character: ${error.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.characters.delete(projectId, characterId),
    onSuccess: () => {
      invalidateList()
      toast.success("Character deleted")
      goToManuscript()
    },
    onError: () => toast.error("Failed to delete character"),
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    )
  }

  const canSave = name.trim().length > 0 && !save.isPending

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <StoryBiblePageHeader
        actions={
          <>
            {!isNew && (
              <ConfirmDialog
                confirmText="Delete"
                description={`Delete "${name}"? This cannot be undone.`}
                onConfirm={() => deleteMutation.mutate()}
                title="Delete character"
                variant="destructive"
              >
                <Button type="button" variant="outline">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </ConfirmDialog>
            )}
            <Button disabled={!canSave} onClick={() => save.mutate()} type="button">
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
        projectId={projectId}
        subtitle="Character"
        title={isNew ? "New character" : name || "Untitled character"}
      />

      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
          <div className="space-y-2">
            <Label htmlFor="character-name">Name *</Label>
            <Input
              autoFocus
              id="character-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Character name"
              value={name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="character-role">Role</Label>
            <Select onValueChange={(value) => setRole(value as CharacterRole)} value={role}>
              <SelectTrigger id="character-role">
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_ROLE}>No role</SelectItem>
                {CHARACTER_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="character-description">Description</Label>
          <Textarea
            className="min-h-[70px]"
            id="character-description"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="A one-line sketch of who they are and what they want."
            value={description}
          />
        </div>

        <div className="space-y-3">
          <Label>Traits</Label>
          <TraitEditor
            canGenerate={!isNew}
            onChange={setTraits}
            onGenerateTrait={async (label, instructions) => {
              if (isNew) {
                return []
              }
              const result = await storyBibleApi.generateCharacterTrait(
                projectId,
                characterId,
                label,
                instructions
              )
              return result.options
            }}
            subjectName={name}
            traits={traits}
          />
        </div>
      </div>
    </div>
  )
}
