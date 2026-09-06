import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { GenerateOptionsDialog } from "@/components/story-bible/generate-options-dialog"
import { StoryBiblePageHeader } from "@/components/story-bible/page-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { api, storyBibleApi } from "@/lib/api"

export const Route = createFileRoute("/projects/$projectId/story-bible/style")({
  component: StylePage,
})

function StylePage() {
  const { projectId } = Route.useParams()
  const queryClient = useQueryClient()
  const [value, setValue] = useState("")
  const [generateOpen, setGenerateOpen] = useState(false)

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.projects.get(projectId),
  })

  useEffect(() => {
    if (project) {
      setValue(project.styleBible ?? "")
    }
  }, [project])

  const save = useMutation({
    mutationFn: () => {
      if (!api.projects.update) {
        throw new Error("Project update is unavailable")
      }
      return api.projects.update(projectId, { styleBible: value.trim() })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      toast.success("Style saved")
    },
    onError: (error: Error) => toast.error(`Couldn't save style: ${error.message}`),
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
          <Button disabled={save.isPending} onClick={() => save.mutate()} type="button">
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        }
        projectId={projectId}
        subtitle="Story Bible"
        title="Style"
      />

      <div className="space-y-4 p-6">
        <p className="text-muted-foreground text-sm">
          Describe the writing voice for this project — narration, tone, rhythm, POV, and comp
          titles. Every AI generation in this project uses this as a guide.
        </p>

        <Button onClick={() => setGenerateOpen(true)} type="button" variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          Generate style options
        </Button>

        <Textarea
          className="min-h-[300px]"
          onChange={(event) => setValue(event.target.value)}
          placeholder="e.g. Tight third-person past tense. Spare, muscular sentences with sudden lyrical turns. Dry humor under tension. In the vein of Cormac McCarthy and Emily St. John Mandel."
          value={value}
        />
      </div>

      <GenerateOptionsDialog
        description="Pick a starting point — you can edit it after."
        onGenerate={async (instructions) => {
          const result = await storyBibleApi.generateStyle(projectId, instructions)
          return result.options
        }}
        onOpenChange={setGenerateOpen}
        onPick={setValue}
        open={generateOpen}
        title="Generate a style guide"
      />
    </div>
  )
}
