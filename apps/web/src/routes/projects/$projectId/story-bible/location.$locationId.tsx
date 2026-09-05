import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { StoryBiblePageHeader } from "@/components/story-bible/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { api } from "@/lib/api"

export const Route = createFileRoute("/projects/$projectId/story-bible/location/$locationId")({
  component: LocationPage,
})

function LocationPage() {
  const { projectId, locationId } = Route.useParams()
  const isNew = locationId === "new"
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: location, isLoading } = useQuery({
    queryKey: ["location", projectId, locationId],
    queryFn: () => api.locations.get(projectId, locationId),
    enabled: !isNew,
  })

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (location) {
      setName(location.name)
      setDescription(location.description ?? "")
    }
  }, [location])

  const goToManuscript = () => navigate({ to: "/projects/$projectId/write", params: { projectId } })

  const invalidateList = () => queryClient.invalidateQueries({ queryKey: ["locations", projectId] })

  const save = useMutation({
    mutationFn: async (): Promise<{ id?: string }> => {
      const payload = { name: name.trim(), description: description.trim() }
      if (isNew) {
        const result = await api.locations.create(projectId, payload)
        return { id: "id" in result ? result.id : undefined }
      }
      await api.locations.update(projectId, locationId, payload)
      return {}
    },
    onSuccess: (result) => {
      invalidateList()
      toast.success(isNew ? "Location created" : "Location saved")
      if (isNew && result.id) {
        navigate({
          to: "/projects/$projectId/story-bible/location/$locationId",
          params: { projectId, locationId: result.id },
          replace: true,
        })
      } else {
        queryClient.invalidateQueries({ queryKey: ["location", projectId, locationId] })
      }
    },
    onError: (error: Error) => toast.error(`Couldn't save location: ${error.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.locations.delete(projectId, locationId),
    onSuccess: () => {
      invalidateList()
      toast.success("Location deleted")
      goToManuscript()
    },
    onError: () => toast.error("Failed to delete location"),
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
                title="Delete location"
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
        subtitle="Location"
        title={isNew ? "New location" : name || "Untitled location"}
      />

      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor="location-name">Name *</Label>
          <Input
            autoFocus
            id="location-name"
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. The Sunken Library, Port Calder"
            value={name}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location-description">Description</Label>
          <Textarea
            className="min-h-[300px]"
            id="location-description"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What does this place look, sound, and feel like? What happens here?"
            value={description}
          />
        </div>
      </div>
    </div>
  )
}
