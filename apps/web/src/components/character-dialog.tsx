import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { api, type Character } from "@/lib/api"

const characterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().optional(),
  // role field removed - users can describe character roles freely in description
  // appearance, personality, backstory, motivation removed - simplified to just name and description
})

type CharacterFormData = z.infer<typeof characterSchema>

interface CharacterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  character?: Character | null
  mode: "create" | "edit"
}

export function CharacterDialog({
  open,
  onOpenChange,
  projectId,
  character,
  mode,
}: CharacterDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: character?.name || "",
      description: character?.description || "",
      // role field removed
      // appearance, personality, backstory, motivation removed - simplified to just name and description
    },
  })

  // Reset form when character or mode changes
  useEffect(() => {
    form.reset({
      name: character?.name || "",
      description: character?.description || "",
      // role field removed
      // appearance, personality, backstory, motivation removed - simplified to just name and description
    })
  }, [character, form])

  const createCharacterMutation = useMutation({
    mutationFn: (data: CharacterFormData) => api.characters.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters", projectId] })
      toast.success("Character created successfully!")
      onOpenChange(false)
      form.reset()
    },
    onError: (error) => {
      toast.error(`Failed to create character: ${error.message}`)
    },
  })

  const updateCharacterMutation = useMutation({
    mutationFn: (data: CharacterFormData) => {
      if (!character?.id) {
        throw new Error("Character ID is required for updates")
      }
      return api.characters.update(projectId, character.id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters", projectId] })
      toast.success("Character updated successfully!")
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Failed to update character: ${error.message}`)
    },
  })

  const onSubmit = (data: CharacterFormData) => {
    if (mode === "create") {
      createCharacterMutation.mutate(data)
    } else {
      updateCharacterMutation.mutate(data)
    }
  }

  const isLoading = createCharacterMutation.isPending || updateCharacterMutation.isPending

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Character" : `Edit ${character?.name}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new character to your project's codex."
              : "Update the character's information."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} name="character_name" placeholder="Character name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[80px]"
                      placeholder="Brief description of the character, including their role in the story"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Appearance, personality, backstory, motivation fields removed - simplified to just name and description */}

            <DialogFooter>
              <Button
                disabled={isLoading}
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button disabled={isLoading} type="submit">
                {(() => {
                  if (isLoading) {
                    return "Saving..."
                  }
                  return mode === "create" ? "Create Character" : "Update Character"
                })()}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
