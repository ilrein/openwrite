import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { api, type Character } from "@/lib/api"

const characterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().optional(),
  role: z.enum(["protagonist", "antagonist", "supporting", "minor"]).optional(),
  appearance: z.string().optional(),
  personality: z.string().optional(),
  backstory: z.string().optional(),
  motivation: z.string().optional(),
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
      role: character?.role || undefined,
      appearance: character?.appearance || "",
      personality: character?.personality || "",
      backstory: character?.backstory || "",
      motivation: character?.motivation || "",
    },
  })

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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Character name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select defaultValue={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="protagonist">Protagonist</SelectItem>
                        <SelectItem value="antagonist">Antagonist</SelectItem>
                        <SelectItem value="supporting">Supporting</SelectItem>
                        <SelectItem value="minor">Minor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[80px]"
                      placeholder="Brief description of the character"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="appearance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appearance</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[80px]"
                      placeholder="Physical description, clothing, distinguishing features"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personality</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[80px]"
                      placeholder="Personality traits, quirks, mannerisms"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="backstory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Backstory</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[80px]"
                      placeholder="Character's history, upbringing, past events"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="motivation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivation</FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[80px]"
                      placeholder="What drives this character? Goals, fears, desires"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
