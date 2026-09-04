import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { GenerateOptionsDialog } from "@/components/story-bible/generate-options-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { api, storyBibleApi } from "@/lib/api"

interface StyleDialogProps {
  onOpenChange: (open: boolean) => void
  open: boolean
  projectId: string
}

/**
 * The Story Bible "Style" section — one long-form field describing the prose
 * voice the AI should match, with a Sudowrite-style "generate options" helper.
 */
export function StyleDialog({ open, onOpenChange, projectId }: StyleDialogProps) {
  const queryClient = useQueryClient()
  const [value, setValue] = useState("")
  const [generateOpen, setGenerateOpen] = useState(false)

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.projects.get(projectId),
    enabled: open,
  })

  useEffect(() => {
    if (open && project) {
      setValue(project.styleBible ?? "")
    }
  }, [open, project])

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
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(`Couldn't save style: ${error.message}`),
  })

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Style</DialogTitle>
            <DialogDescription>
              Describe the writing voice for this project — narration, tone, rhythm, POV, and comp
              titles. Every AI generation uses this as a guide.
            </DialogDescription>
          </DialogHeader>

          <Button
            className="w-full"
            onClick={() => setGenerateOpen(true)}
            type="button"
            variant="outline"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate style options
          </Button>

          <Textarea
            className="min-h-[240px]"
            onChange={(event) => setValue(event.target.value)}
            placeholder="e.g. Tight third-person past tense. Spare, muscular sentences with sudden lyrical turns. Dry humor under tension. In the vein of Cormac McCarthy and Emily St. John Mandel."
            value={value}
          />

          <DialogFooter>
            <Button
              disabled={save.isPending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={save.isPending} onClick={() => save.mutate()} type="button">
              {save.isPending ? "Saving…" : "Save style"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </>
  )
}
