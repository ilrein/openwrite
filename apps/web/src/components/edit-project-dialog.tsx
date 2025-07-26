import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"
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
import { api, type Project } from "@/lib/api"

interface EditProjectForm {
  title: string
  description: string
  type: "novel" | "trilogy" | "series" | "short_story_collection" | "graphic_novel" | "screenplay"
  genre: string
  targetWordCount: string
  visibility: "private" | "organization" | "public"
}

interface EditProjectDialogProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
  const queryClient = useQueryClient()
  const [editForm, setEditForm] = useState<EditProjectForm>({
    title: project.title,
    description: project.description || "",
    type: project.type,
    genre: project.genre || "",
    targetWordCount: project.targetWordCount?.toString() || "",
    visibility: project.visibility,
  })

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (data: EditProjectForm) => {
      if (!api.projects.update) {
        throw new Error("Update method not available")
      }
      const result = await api.projects.update(project.id, {
        title: data.title,
        description: data.description || null,
        type: data.type,
        genre: data.genre || null,
        targetWordCount: data.targetWordCount ? Number.parseInt(data.targetWordCount, 10) : null,
        visibility: data.visibility,
      })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      onOpenChange(false)
      toast.success("Project updated successfully! ✨", {
        description: "Your changes have been saved.",
      })
    },
    onError: (error) => {
      toast.error("Failed to update project", {
        description: error instanceof Error ? error.message : "Please try again.",
      })
    },
  })

  const handleUpdateProject = () => {
    if (!editForm.title.trim()) {
      toast.error("Title is required")
      return
    }
    updateProjectMutation.mutate(editForm)
  }

  const handleCancel = () => {
    // Reset form to original values
    setEditForm({
      title: project.title,
      description: project.description || "",
      type: project.type,
      genre: project.genre || "",
      targetWordCount: project.targetWordCount?.toString() || "",
      visibility: project.visibility,
    })
    onOpenChange(false)
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update your project details. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="The Great Adventure"
              value={editForm.title}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="A brief description of your project..."
              value={editForm.description}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-type">Project Type</Label>
              <Select
                onValueChange={(
                  value:
                    | "novel"
                    | "trilogy"
                    | "series"
                    | "short_story_collection"
                    | "graphic_novel"
                    | "screenplay"
                ) => setEditForm((prev) => ({ ...prev, type: value }))}
                value={editForm.type}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="novel">Novel</SelectItem>
                  <SelectItem value="trilogy">Trilogy</SelectItem>
                  <SelectItem value="series">Series</SelectItem>
                  <SelectItem value="short_story_collection">Short Story Collection</SelectItem>
                  <SelectItem value="graphic_novel">Graphic Novel</SelectItem>
                  <SelectItem value="screenplay">Screenplay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-genre">Genre</Label>
                <Input
                  id="edit-genre"
                  onChange={(e) => setEditForm((prev) => ({ ...prev, genre: e.target.value }))}
                  placeholder="e.g., Fantasy, Sci-Fi"
                  value={editForm.genre}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-targetWordCount">Target Words</Label>
                <Input
                  id="edit-targetWordCount"
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, targetWordCount: e.target.value }))
                  }
                  placeholder="50000"
                  type="number"
                  value={editForm.targetWordCount}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-visibility">Visibility</Label>
              <Select
                onValueChange={(value: "private" | "organization" | "public") =>
                  setEditForm((prev) => ({ ...prev, visibility: value }))
                }
                value={editForm.visibility}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleCancel} variant="outline">
            Cancel
          </Button>
          <Button disabled={updateProjectMutation.isPending} onClick={handleUpdateProject}>
            {updateProjectMutation.isPending ? "Updating..." : "Update Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
