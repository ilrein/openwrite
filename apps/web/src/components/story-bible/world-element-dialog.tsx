import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { TraitEditor } from "@/components/story-bible/trait-editor"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  storyBibleApi,
  type Trait,
  traitsFromLabels,
  WORLD_ELEMENT_DEFAULT_TRAIT_LABELS,
  WORLD_ELEMENT_TYPE_OPTIONS,
  type WorldElement,
  type WorldElementType,
} from "@/lib/api"

interface WorldElementDialogProps {
  element?: WorldElement | null
  mode: "create" | "edit"
  onOpenChange: (open: boolean) => void
  open: boolean
  projectId: string
}

const seedTraits = (element?: WorldElement | null): Trait[] => {
  if (element?.traits && element.traits.length > 0) {
    return element.traits
  }
  return traitsFromLabels(WORLD_ELEMENT_DEFAULT_TRAIT_LABELS[element?.type ?? "setting"])
}

export function WorldElementDialog({
  open,
  onOpenChange,
  projectId,
  element,
  mode,
}: WorldElementDialogProps) {
  const queryClient = useQueryClient()

  const [name, setName] = useState("")
  const [type, setType] = useState<WorldElementType>("setting")
  const [description, setDescription] = useState("")
  const [traits, setTraits] = useState<Trait[]>([])
  // Track whether the writer has hand-edited traits so a type switch doesn't
  // wipe their work — it only re-seeds an untouched default set.
  const [traitsPristine, setTraitsPristine] = useState(true)

  useEffect(() => {
    if (!open) {
      return
    }
    setName(element?.name ?? "")
    setType(element?.type ?? "setting")
    setDescription(element?.description ?? "")
    setTraits(seedTraits(element))
    setTraitsPristine(mode === "create")
  }, [open, element, mode])

  const changeType = (next: WorldElementType) => {
    setType(next)
    if (traitsPristine) {
      setTraits(traitsFromLabels(WORLD_ELEMENT_DEFAULT_TRAIT_LABELS[next]))
    }
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name: name.trim(),
        type,
        description: description.trim(),
        traits: traits.filter((trait) => trait.label.trim()),
      }
      if (mode === "edit" && element?.id) {
        return storyBibleApi.worldElements.update(projectId, element.id, payload)
      }
      return storyBibleApi.worldElements.create(projectId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["world-elements", projectId] })
      toast.success(mode === "edit" ? "Element updated" : "Element created")
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(`Couldn't save element: ${error.message}`),
  })

  const canSave = name.trim().length > 0 && !save.isPending

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (canSave) {
      save.mutate()
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New worldbuilding element" : `Edit ${element?.name ?? "element"}`}
          </DialogTitle>
          <DialogDescription>
            Pick a type to seed its traits, then flesh each one out — the ✨ drafts options for you.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
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
              canGenerate={mode === "edit" && Boolean(element?.id)}
              onChange={(next) => {
                setTraits(next)
                setTraitsPristine(false)
              }}
              onGenerateTrait={async (label, instructions) => {
                if (!element?.id) {
                  return []
                }
                const result = await storyBibleApi.worldElements.generateTrait(
                  projectId,
                  element.id,
                  label,
                  instructions
                )
                return result.options
              }}
              subjectName={name}
              traits={traits}
            />
          </div>

          <DialogFooter>
            <Button
              disabled={save.isPending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={!canSave} type="submit">
              {(() => {
                if (save.isPending) {
                  return "Saving…"
                }
                return mode === "create" ? "Create element" : "Save changes"
              })()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
