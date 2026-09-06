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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { api, LORE_TYPE_OPTIONS } from "@/lib/api"

export const Route = createFileRoute("/projects/$projectId/story-bible/lore/$loreId")({
  component: LorePage,
})

const NO_TYPE = "none"

function LorePage() {
  const { projectId, loreId } = Route.useParams()
  const isNew = loreId === "new"
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: entry, isLoading } = useQuery({
    queryKey: ["lore-entry", projectId, loreId],
    queryFn: () => api.lore.get(projectId, loreId),
    enabled: !isNew,
  })

  const [name, setName] = useState("")
  const [type, setType] = useState(NO_TYPE)
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (entry) {
      setName(entry.name)
      setType(entry.type ?? NO_TYPE)
      setDescription(entry.description ?? "")
    }
  }, [entry])

  const goToManuscript = () => navigate({ to: "/projects/$projectId/write", params: { projectId } })

  const invalidateList = () => queryClient.invalidateQueries({ queryKey: ["lore", projectId] })

  const save = useMutation({
    mutationFn: async (): Promise<{ id?: string }> => {
      const payload = {
        name: name.trim(),
        type: type === NO_TYPE ? undefined : type,
        description: description.trim(),
      }
      if (isNew) {
        const result = await api.lore.create(projectId, payload)
        return { id: "id" in result ? result.id : undefined }
      }
      await api.lore.update(projectId, loreId, payload)
      return {}
    },
    onSuccess: (result) => {
      invalidateList()
      toast.success(isNew ? "Lore entry created" : "Lore entry saved")
      if (isNew && result.id) {
        navigate({
          to: "/projects/$projectId/story-bible/lore/$loreId",
          params: { projectId, loreId: result.id },
          replace: true,
        })
      } else {
        queryClient.invalidateQueries({ queryKey: ["lore-entry", projectId, loreId] })
      }
    },
    onError: (error: Error) => toast.error(`Couldn't save lore entry: ${error.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.lore.delete(projectId, loreId),
    onSuccess: () => {
      invalidateList()
      toast.success("Lore entry deleted")
      goToManuscript()
    },
    onError: () => toast.error("Failed to delete lore entry"),
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
                title="Delete lore entry"
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
        subtitle="Lore"
        title={isNew ? "New lore entry" : name || "Untitled entry"}
      />

      <div className="space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
          <div className="space-y-2">
            <Label htmlFor="lore-name">Name *</Label>
            <Input
              autoFocus
              id="lore-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. The Long Winter, Blood Magic"
              value={name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lore-type">Type</Label>
            <Select onValueChange={setType} value={type}>
              <SelectTrigger id="lore-type">
                <SelectValue placeholder="Choose a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TYPE}>No type</SelectItem>
                {LORE_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lore-description">Description</Label>
          <Textarea
            className="min-h-[300px]"
            id="lore-description"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="The history, rule, or fact — and how it shapes the story."
            value={description}
          />
        </div>
      </div>
    </div>
  )
}
