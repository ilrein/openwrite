import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { StoryBiblePageHeader } from "@/components/story-bible/page-header"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { api, storyBibleApi } from "@/lib/api"

export const Route = createFileRoute("/projects/$projectId/story-bible/group/$groupId")({
  component: GroupPage,
})

function GroupPage() {
  const { projectId, groupId } = Route.useParams()
  const isNew = groupId === "new"
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: group, isLoading } = useQuery({
    queryKey: ["character-group", projectId, groupId],
    queryFn: () => storyBibleApi.characterGroups.get(projectId, groupId),
    enabled: !isNew,
  })

  const { data: characters = [] } = useQuery({
    queryKey: ["characters", projectId],
    queryFn: () => api.characters.list(projectId),
  })

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [memberIds, setMemberIds] = useState<string[]>([])

  useEffect(() => {
    if (group) {
      setName(group.name)
      setDescription(group.description ?? "")
      setMemberIds(group.memberIds)
    }
  }, [group])

  const goToManuscript = () => navigate({ to: "/projects/$projectId/write", params: { projectId } })

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ["character-groups", projectId] })

  const toggleMember = (id: string, checked: boolean) => {
    setMemberIds((prev) => (checked ? [...prev, id] : prev.filter((memberId) => memberId !== id)))
  }

  const save = useMutation({
    mutationFn: async (): Promise<{ success: boolean; id?: string }> => {
      const payload = { name: name.trim(), description: description.trim(), memberIds }
      if (isNew) {
        return await storyBibleApi.characterGroups.create(projectId, payload)
      }
      return await storyBibleApi.characterGroups.update(projectId, groupId, payload)
    },
    onSuccess: (result) => {
      invalidateList()
      toast.success(isNew ? "Group created" : "Group saved")
      if (isNew && result.id) {
        navigate({
          to: "/projects/$projectId/story-bible/group/$groupId",
          params: { projectId, groupId: result.id },
          replace: true,
        })
      } else {
        queryClient.invalidateQueries({ queryKey: ["character-group", projectId, groupId] })
      }
    },
    onError: (error: Error) => toast.error(`Couldn't save group: ${error.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: () => storyBibleApi.characterGroups.delete(projectId, groupId),
    onSuccess: () => {
      invalidateList()
      toast.success("Group deleted")
      goToManuscript()
    },
    onError: () => toast.error("Failed to delete group"),
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
                title="Delete group"
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
        subtitle="Character group"
        title={isNew ? "New character group" : name || "Untitled group"}
      />

      <div className="space-y-6 p-6">
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
            className="min-h-[90px]"
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
            <div className="grid gap-1 rounded-md border p-2 sm:grid-cols-2">
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
      </div>
    </div>
  )
}
