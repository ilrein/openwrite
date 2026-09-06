import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { StoryBiblePageHeader } from "@/components/story-bible/page-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { api, storyBibleApi } from "@/lib/api"

export const Route = createFileRoute("/projects/$projectId/story-bible/braindump")({
  component: BraindumpPage,
})

function BraindumpPage() {
  const { projectId } = Route.useParams()
  const queryClient = useQueryClient()
  const [value, setValue] = useState("")

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.projects.get(projectId),
  })

  useEffect(() => {
    if (project) {
      setValue(project.braindump ?? "")
    }
  }, [project])

  const save = useMutation({
    mutationFn: () => {
      if (!api.projects.update) {
        throw new Error("Project update is unavailable")
      }
      return api.projects.update(projectId, { braindump: value })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      toast.success("Braindump saved")
    },
    onError: (error: Error) => toast.error(`Couldn't save braindump: ${error.message}`),
  })

  const generate = useMutation({
    mutationFn: () => storyBibleApi.generateProjectBraindump(projectId),
    onSuccess: (text) => {
      if (!text) {
        toast.error("The model returned nothing. Try again.")
        return
      }
      setValue((prev) => (prev.trim() ? `${prev.trim()}\n\n${text}` : text))
    },
    onError: (error: Error) => toast.error(error.message),
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-6 h-60 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <StoryBiblePageHeader
        actions={
          <>
            <Button
              disabled={generate.isPending}
              onClick={() => generate.mutate()}
              type="button"
              variant="outline"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {generate.isPending ? "Thinking…" : "Riff for me"}
            </Button>
            <Button disabled={save.isPending} onClick={() => save.mutate()} type="button">
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
        projectId={projectId}
        subtitle="Story Bible"
        title="Braindump"
      />

      <div className="space-y-4 p-6">
        <p className="text-muted-foreground text-sm">
          A scratchpad for the whole project — throw out anything: premises, images, names,
          complications, half-formed ideas. Nothing here needs to be polished.
        </p>
        <Textarea
          className="min-h-[60vh]"
          onChange={(event) => setValue(event.target.value)}
          placeholder="Just write. What if… / a scene where… / what does the ending feel like…"
          value={value}
        />
      </div>
    </div>
  )
}
