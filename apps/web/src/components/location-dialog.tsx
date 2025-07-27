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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { api, type Location } from "@/lib/api"

const locationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().optional(),
  type: z
    .enum(["city", "country", "building", "room", "fantasy_realm", "planet", "dimension"])
    .optional(),
  parentLocationId: z.string().optional(),
  image: z.string().optional(),
})

type LocationFormData = z.infer<typeof locationSchema>

interface LocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  location?: Location | null
  mode: "create" | "edit"
}

export function LocationDialog({
  open,
  onOpenChange,
  projectId,
  location,
  mode,
}: LocationDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location?.name || "",
      description: location?.description || "",
      type: location?.type || undefined,
      parentLocationId: location?.parentLocationId || "",
      image: location?.image || "",
    },
  })

  // Reset form when location or mode changes
  useEffect(() => {
    form.reset({
      name: location?.name || "",
      description: location?.description || "",
      type: location?.type || undefined,
      parentLocationId: location?.parentLocationId || "",
      image: location?.image || "",
    })
  }, [location, form])

  const createLocationMutation = useMutation({
    mutationFn: (data: LocationFormData) => api.locations.create(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", projectId] })
      toast.success("Location created successfully!")
      onOpenChange(false)
      form.reset()
    },
    onError: (error) => {
      toast.error(`Failed to create location: ${error.message}`)
    },
  })

  const updateLocationMutation = useMutation({
    mutationFn: (data: LocationFormData) => {
      if (!location?.id) {
        throw new Error("Location ID is required for updates")
      }
      return api.locations.update(projectId, location.id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations", projectId] })
      toast.success("Location updated successfully!")
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Failed to update location: ${error.message}`)
    },
  })

  const onSubmit = (data: LocationFormData) => {
    if (mode === "create") {
      createLocationMutation.mutate(data)
    } else {
      updateLocationMutation.mutate(data)
    }
  }

  const isLoading = createLocationMutation.isPending || updateLocationMutation.isPending

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Location" : `Edit ${location?.name}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new location to your project's world."
              : "Update the location's information."}
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
                      <Input placeholder="Location name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select defaultValue={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="city">City</SelectItem>
                        <SelectItem value="country">Country</SelectItem>
                        <SelectItem value="building">Building</SelectItem>
                        <SelectItem value="room">Room</SelectItem>
                        <SelectItem value="fantasy_realm">Fantasy Realm</SelectItem>
                        <SelectItem value="planet">Planet</SelectItem>
                        <SelectItem value="dimension">Dimension</SelectItem>
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
                      className="min-h-[100px]"
                      placeholder="Describe this location, its atmosphere, key features..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentLocationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Location</FormLabel>
                  <FormControl>
                    <Input placeholder="ID of parent location (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg (optional)" {...field} />
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
                  return mode === "create" ? "Create Location" : "Update Location"
                })()}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
