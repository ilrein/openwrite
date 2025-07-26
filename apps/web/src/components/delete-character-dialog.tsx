import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { api, type Character } from "@/lib/api"

interface DeleteCharacterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  character: Character
}

export function DeleteCharacterDialog({
  open,
  onOpenChange,
  projectId,
  character,
}: DeleteCharacterDialogProps) {
  const queryClient = useQueryClient()

  const deleteCharacterMutation = useMutation({
    mutationFn: () => api.characters.delete(projectId, character.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters", projectId] })
      toast.success(`Character "${character.name}" deleted successfully!`)
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Failed to delete character: ${error.message}`)
    },
  })

  const handleDelete = () => {
    deleteCharacterMutation.mutate()
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Character</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{character.name}</strong>? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteCharacterMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteCharacterMutation.isPending}
            onClick={handleDelete}
          >
            {deleteCharacterMutation.isPending ? "Deleting..." : "Delete Character"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
