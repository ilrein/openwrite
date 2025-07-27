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
import { api, type Location } from "@/lib/api"

interface DeleteLocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  location: Location
  projectId: string
}

export function DeleteLocationDialog({
  open,
  onOpenChange,
  location,
  projectId,
}: DeleteLocationDialogProps) {
  const queryClient = useQueryClient()

  const deleteLocationMutation = useMutation({
    mutationFn: () => api.locations.delete(projectId, location.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", projectId] })
      toast.success(`Location "${location.name}" deleted successfully!`)
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Failed to delete location: ${error.message}`)
    },
  })

  const handleDelete = () => {
    deleteLocationMutation.mutate()
  }

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Location</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{location.name}"? This action cannot be undone and will
            permanently remove this location from your project's codex.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteLocationMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteLocationMutation.isPending}
            onClick={handleDelete}
          >
            {deleteLocationMutation.isPending ? "Deleting..." : "Delete Location"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
