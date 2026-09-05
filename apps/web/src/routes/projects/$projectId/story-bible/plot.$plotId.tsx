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
import { api, PLOT_STATUS_OPTIONS, PLOT_TYPE_OPTIONS } from "@/lib/api"

export const Route = createFileRoute("/projects/$projectId/story-bible/plot/$plotId")({
  component: PlotPage,
})

const NO_TYPE = "none"

function PlotPage() {
  const { projectId, plotId } = Route.useParams()
  const isNew = plotId === "new"
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: threads = [] } = useQuery({
    queryKey: ["plot", projectId],
    queryFn: () => api.plot.list(projectId),
  })
  const entry = threads.find((thread) => thread.id === plotId)
  const isLoading = !isNew && threads.length === 0 && entry === undefined

  const [title, setTitle] = useState("")
  const [type, setType] = useState(NO_TYPE)
  const [status, setStatus] = useState("planned")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (entry) {
      setTitle(entry.title)
      setType(entry.type ?? NO_TYPE)
      setStatus(entry.status ?? "planned")
      setDescription(entry.description ?? "")
    }
  }, [entry])

  const goToManuscript = () => navigate({ to: "/projects/$projectId/write", params: { projectId } })

  const invalidateList = () => queryClient.invalidateQueries({ queryKey: ["plot", projectId] })

  const save = useMutation({
    mutationFn: async (): Promise<{ id?: string }> => {
      const payload = {
        title: title.trim(),
        type: type === NO_TYPE ? undefined : type,
        status,
        description: description.trim(),
        order: entry?.order ?? threads.length + 1,
      }
      if (isNew) {
        const result = await api.plot.create(projectId, payload)
        return { id: "id" in result ? result.id : undefined }
      }
      await api.plot.update(projectId, plotId, payload)
      return {}
    },
    onSuccess: (result) => {
      invalidateList()
      toast.success(isNew ? "Plot thread created" : "Plot thread saved")
      if (isNew && result.id) {
        navigate({
          to: "/projects/$projectId/story-bible/plot/$plotId",
          params: { projectId, plotId: result.id },
          replace: true,
        })
      }
    },
    onError: (error: Error) => toast.error(`Couldn't save plot thread: ${error.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.plot.delete(projectId, plotId),
    onSuccess: () => {
      invalidateList()
      toast.success("Plot thread deleted")
      goToManuscript()
    },
    onError: () => toast.error("Failed to delete plot thread"),
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    )
  }

  const canSave = title.trim().length > 0 && !save.isPending

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <StoryBiblePageHeader
        actions={
          <>
            {!isNew && (
              <ConfirmDialog
                confirmText="Delete"
                description={`Delete "${title}"? This cannot be undone.`}
                onConfirm={() => deleteMutation.mutate()}
                title="Delete plot thread"
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
        subtitle="Plot thread"
        title={isNew ? "New plot thread" : title || "Untitled thread"}
      />

      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Label htmlFor="plot-title">Title *</Label>
          <Input
            autoFocus
            id="plot-title"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Mara's revenge, the missing heir"
            value={title}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="plot-type">Type</Label>
            <Select onValueChange={setType} value={type}>
              <SelectTrigger id="plot-type">
                <SelectValue placeholder="Choose a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_TYPE}>No type</SelectItem>
                {PLOT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="plot-status">Status</Label>
            <Select onValueChange={setStatus} value={status}>
              <SelectTrigger id="plot-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLOT_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="plot-description">Description</Label>
          <Textarea
            className="min-h-[300px]"
            id="plot-description"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is this thread, who drives it, and how does it resolve?"
            value={description}
          />
        </div>
      </div>
    </div>
  )
}
