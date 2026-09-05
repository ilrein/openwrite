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
  storyBibleApi,
  type Trait,
  traitsFromLabels,
  WORLD_ELEMENT_DEFAULT_TRAIT_LABELS,
  WORLD_ELEMENT_TYPE_OPTIONS,
  type WorldElementType,
} from "@/lib/api"

export const Route = createFileRoute("/projects/$projectId/story-bible/world/$worldId")({
  component: WorldElementPage,
})

function WorldElementPage() {
  const { projectId, worldId } = Route.useParams()
  const isNew = worldId === "new"
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: element, isLoading } = useQuery({
    queryKey: ["world-element", projectId, worldId],
    queryFn: () => storyBibleApi.worldElements.get(projectId, worldId),
    enabled: !isNew,
  })

  const [name, setName] = useState("")
  const [type, setType] = useState<WorldElementType>("setting")
  const [description, setDescription] = useState("")
  const [traits, setTraits] = useState<Trait[]>(
    traitsFromLabels(WORLD_ELEMENT_DEFAULT_TRAIT_LABELS.setting)
  )
  // Only re-seed traits from the type's defaults while the writer hasn't
  // touched them yet — a type switch shouldn't wipe hand-written work.
  const [traitsPristine, setTraitsPristine] = useState(true)

  useEffect(() => {
    if (element) {
      setName(element.name)
      setType(element.type)
      setDescription(element.description ?? "")
      setTraits(
        element.traits.length > 0
          ? element.traits
          : traitsFromLabels(WORLD_ELEMENT_DEFAULT_TRAIT_LABELS[element.type])
      )
      setTraitsPristine(false)
    }
  }, [element])

  const changeType = (next: WorldElementType) => {
    setType(next)
    if (traitsPristine) {
      setTraits(traitsFromLabels(WORLD_ELEMENT_DEFAULT_TRAIT_LABELS[next]))
    }
  }

  const goToManuscript = () => navigate({ to: "/projects/$projectId/write", params: { projectId } })

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ["world-elements", projectId] })

  const save = useMutation({
    mutationFn: async (): Promise<{ success: boolean; id?: string }> => {
      const payload = {
        name: name.trim(),
        type,
        description: description.trim(),
        traits: traits.filter((trait) => trait.label.trim()),
      }
      if (isNew) {
        return await storyBibleApi.worldElements.create(projectId, payload)
      }
      return await storyBibleApi.worldElements.update(projectId, worldId, payload)
    },
    onSuccess: (result) => {
      invalidateList()
      toast.success(isNew ? "Element created" : "Element saved")
      if (isNew && result.id) {
        navigate({
          to: "/projects/$projectId/story-bible/world/$worldId",
          params: { projectId, worldId: result.id },
          replace: true,
        })
      } else {
        queryClient.invalidateQueries({ queryKey: ["world-element", projectId, worldId] })
      }
    },
    onError: (error: Error) => toast.error(`Couldn't save element: ${error.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: () => storyBibleApi.worldElements.delete(projectId, worldId),
    onSuccess: () => {
      invalidateList()
      toast.success("Element deleted")
      goToManuscript()
    },
    onError: () => toast.error("Failed to delete element"),
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
                title="Delete element"
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
        subtitle="Worldbuilding"
        title={isNew ? "New worldbuilding element" : name || "Untitled element"}
      />

      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
          <div className="space-y-2">
            <Label htmlFor="world-element-name">Name *</Label>
            <Input
              autoFocus
              id="world-element-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. The Iron Bank, Aetherweave, King's Landing"
              value={name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="world-element-type">Type</Label>
            <Select onValueChange={(value) => changeType(value as WorldElementType)} value={type}>
              <SelectTrigger id="world-element-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORLD_ELEMENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="world-element-description">Description</Label>
          <Textarea
            className="min-h-[70px]"
            id="world-element-description"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="A one-line summary of what this is."
            value={description}
          />
        </div>

        <div className="space-y-3">
          <Label>Traits</Label>
          <TraitEditor
            canGenerate={!isNew}
            onChange={(next) => {
              setTraits(next)
              setTraitsPristine(false)
            }}
            onGenerateTrait={async (label, instructions) => {
              if (isNew) {
                return []
              }
              const result = await storyBibleApi.worldElements.generateTrait(
                projectId,
                worldId,
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
