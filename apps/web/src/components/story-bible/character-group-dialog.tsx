import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
import { api, type CharacterGroup, storyBibleApi } from "@/lib/api"

interface CharacterGroupDialogProps {
  group?: CharacterGroup | null
  mode: "create" | "edit"
  onOpenChange: (open: boolean) => void
  open: boolean
  projectId: string
}

export function CharacterGroupDialog({
  open,
  onOpenChange,
  projectId,
  group,
  mode,
}: CharacterGroupDialogProps) {
  const queryClient = useQueryClient()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [memberIds, setMemberIds] = useState<string[]>([])

  const { data: characters = [] } = useQuery({
    queryKey: ["characters", projectId],
    queryFn: () => api.characters.list(projectId),
    enabled: open,
  })

  useEffect(() => {
    if (!open) {
      return
    }
    setName(group?.name ?? "")
    setDescription(group?.description ?? "")
    setMemberIds(group?.memberIds ?? [])
  }, [open, group])

  const toggleMember = (id: string, checked: boolean) => {
    setMemberIds((prev) => (checked ? [...prev, id] : prev.filter((memberId) => memberId !== id)))
  }

  const save = useMutation({
    mutationFn: () => {
      const payload = { name: name.trim(), description: description.trim(), memberIds }
      if (mode === "edit" && group?.id) {
        return storyBibleApi.characterGroups.update(projectId, group.id, payload)
      }
      return storyBibleApi.characterGroups.create(projectId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["character-groups", projectId] })
      toast.success(mode === "edit" ? "Group updated" : "Group created")
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(`Couldn't save group: ${error.message}`),
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
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New character group" : `Edit ${group?.name ?? "group"}`}
          </DialogTitle>
          <DialogDescription>
            Group characters that belong together — a gang, a family, a crew — then add their
            members.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="group-name">Name *</Label>
            <Input
              autoFocus
              id="group-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. The Peaky Blinders, House Corrino"
              value={name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description">Description</Label>
            <Textarea
              className="min-h-[64px]"
              id="group-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What binds this group together?"
              value={description}
            />
          </div>

          <div className="space-y-2">
            <Label>Members</Label>
            {characters.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No characters yet — create some first, then add them here.
              </p>
            ) : (
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
                {characters.map((character) => (
                  <label
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent"
                    htmlFor={`group-member-${character.id}`}
                    key={character.id}
                  >
                    <Checkbox
                      checked={memberIds.includes(character.id)}
                      id={`group-member-${character.id}`}
                      onCheckedChange={(checked) => toggleMember(character.id, checked === true)}
                    />
                    {character.name}
                  </label>
                ))}
              </div>
            )}
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
                return mode === "create" ? "Create group" : "Save changes"
              })()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
