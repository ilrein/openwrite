import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { StoryBiblePageHeader } from "@/components/story-bible/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { storyBibleApi } from "@/lib/api"

export const Route = createFileRoute("/projects/$projectId/story-bible/note/$noteId")({
  component: NotePage,
})

function NotePage() {
  const { projectId, noteId } = Route.useParams()
  const isNew = noteId === "new"
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: note, isLoading } = useQuery({
    queryKey: ["note", projectId, noteId],
    queryFn: () => storyBibleApi.notes.get(projectId, noteId),
    enabled: !isNew,
  })

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content ?? "")
    }
  }, [note])

  const goToManuscript = () => navigate({ to: "/projects/$projectId/write", params: { projectId } })

  const invalidateList = () => queryClient.invalidateQueries({ queryKey: ["notes", projectId] })

  const save = useMutation({
    mutationFn: async (): Promise<{ success: boolean; id?: string }> => {
      const payload = { title: title.trim() || "Untitled note", content }
      if (isNew) {
        return await storyBibleApi.notes.create(projectId, payload)
      }
      return await storyBibleApi.notes.update(projectId, noteId, payload)
    },
    onSuccess: (result) => {
      invalidateList()
      toast.success(isNew ? "Note created" : "Note saved")
      if (isNew && result.id) {
        navigate({
          to: "/projects/$projectId/story-bible/note/$noteId",
          params: { projectId, noteId: result.id },
          replace: true,
        })
      } else {
        queryClient.invalidateQueries({ queryKey: ["note", projectId, noteId] })
      }
    },
    onError: (error: Error) => toast.error(`Couldn't save note: ${error.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: () => storyBibleApi.notes.delete(projectId, noteId),
    onSuccess: () => {
      invalidateList()
      toast.success("Note deleted")
      goToManuscript()
    },
    onError: () => toast.error("Failed to delete note"),
  })

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Loading note…</div>
  }

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
                title="Delete note"
                variant="destructive"
              >
                <Button type="button" variant="outline">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </ConfirmDialog>
            )}
            <Button disabled={save.isPending} onClick={() => save.mutate()} type="button">
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
        projectId={projectId}
        subtitle="Note"
        title={isNew ? "New note" : title || "Untitled note"}
      />

      <div className="space-y-4 p-6">
        <Input
          aria-label="Note title"
          autoFocus
          className="font-medium text-lg"
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Note title"
          value={title}
        />
        <Textarea
          className="min-h-[60vh]"
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write anything — a quick idea, a snippet of research, a reminder to yourself…"
          value={content}
        />
      </div>
    </div>
  )
}
