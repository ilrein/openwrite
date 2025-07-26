import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
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
import { api, type Character, type Location, type LoreEntry, type PlotThread } from "@/lib/api"

// Define field types for dynamic form generation
type FieldType = "text" | "textarea" | "select" | "number"

interface CodexFormField {
  name: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  validation?: z.ZodSchema<unknown>
}

// Character form configuration based on database schema
const characterFormConfig: CodexFormField[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    required: true,
    placeholder: "Character name",
    validation: z.string().min(1, "Name is required").max(100, "Name is too long"),
  },
  {
    name: "role",
    label: "Role",
    type: "select",
    placeholder: "Select a role",
    options: [
      { value: "protagonist", label: "Protagonist" },
      { value: "antagonist", label: "Antagonist" },
      { value: "supporting", label: "Supporting" },
      { value: "minor", label: "Minor" },
    ],
    validation: z
      .union([z.enum(["protagonist", "antagonist", "supporting", "minor"]), z.literal("")])
      .optional(),
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Brief description of the character",
    validation: z.string().optional(),
  },
  {
    name: "appearance",
    label: "Appearance",
    type: "textarea",
    placeholder: "Physical description, clothing, distinguishing features",
    validation: z.string().optional(),
  },
  {
    name: "personality",
    label: "Personality",
    type: "textarea",
    placeholder: "Personality traits, quirks, mannerisms",
    validation: z.string().optional(),
  },
  {
    name: "backstory",
    label: "Backstory",
    type: "textarea",
    placeholder: "Character's history, upbringing, past events",
    validation: z.string().optional(),
  },
  {
    name: "motivation",
    label: "Motivation",
    type: "textarea",
    placeholder: "What drives this character? Goals, fears, desires",
    validation: z.string().optional(),
  },
]

// Location form configuration based on database schema
const locationFormConfig: CodexFormField[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    required: true,
    placeholder: "Location name",
    validation: z.string().min(1, "Name is required").max(100, "Name is too long"),
  },
  {
    name: "type",
    label: "Type",
    type: "select",
    placeholder: "Select a type",
    options: [
      { value: "city", label: "City" },
      { value: "country", label: "Country" },
      { value: "building", label: "Building" },
      { value: "room", label: "Room" },
      { value: "fantasy_realm", label: "Fantasy Realm" },
      { value: "planet", label: "Planet" },
      { value: "dimension", label: "Dimension" },
    ],
    validation: z
      .enum(["city", "country", "building", "room", "fantasy_realm", "planet", "dimension"])
      .optional(),
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Describe this location in detail",
    validation: z.string().optional(),
  },
]

// Lore form configuration - using generic fields for now
const loreFormConfig: CodexFormField[] = [
  {
    name: "name",
    label: "Title",
    type: "text",
    required: true,
    placeholder: "Lore entry title",
    validation: z.string().min(1, "Title is required").max(100, "Title is too long"),
  },
  {
    name: "type",
    label: "Type",
    type: "select",
    placeholder: "Select a type",
    options: [
      { value: "core_rule", label: "Core Rule" },
      { value: "history", label: "History" },
      { value: "culture", label: "Culture" },
      { value: "magic_system", label: "Magic System" },
      { value: "technology", label: "Technology" },
      { value: "religion", label: "Religion" },
      { value: "politics", label: "Politics" },
      { value: "custom", label: "Custom" },
    ],
    validation: z.string().optional(),
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Describe this lore entry in detail",
    validation: z.string().optional(),
  },
]

// Plot form configuration - for story structure and narrative threads
const plotFormConfig: CodexFormField[] = [
  {
    name: "title",
    label: "Title",
    type: "text",
    required: true,
    placeholder: "Plot thread title",
    validation: z.string().min(1, "Title is required").max(100, "Title is too long"),
  },
  {
    name: "type",
    label: "Type",
    type: "select",
    placeholder: "Select a type",
    options: [
      { value: "inciting_incident", label: "Inciting Incident" },
      { value: "plot_point_1", label: "Plot Point 1" },
      { value: "midpoint", label: "Midpoint" },
      { value: "plot_point_2", label: "Plot Point 2" },
      { value: "climax", label: "Climax" },
      { value: "resolution", label: "Resolution" },
      { value: "custom", label: "Custom" },
    ],
    validation: z.string().optional(),
  },
  {
    name: "order",
    label: "Order",
    type: "number",
    placeholder: "Order in story (1, 2, 3...)",
    validation: z.number().int().positive("Order must be a positive number"),
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    placeholder: "Select status",
    options: [
      { value: "planned", label: "Planned" },
      { value: "in_progress", label: "In Progress" },
      { value: "completed", label: "Completed" },
    ],
    validation: z.string().optional(),
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Describe this plot thread in detail",
    validation: z.string().optional(),
  },
]

// Create dynamic schema from form config
const createDynamicSchema = (fields: CodexFormField[]) => {
  const schemaFields: Record<string, z.ZodSchema<unknown>> = {}

  for (const field of fields) {
    if (field.validation) {
      schemaFields[field.name] = field.validation
    } else {
      schemaFields[field.name] = z.string().optional()
    }
  }

  return z.object(schemaFields)
}

// Get form configuration based on entry type
const getFormConfig = (entryType: "characters" | "locations" | "lore" | "plot") => {
  switch (entryType) {
    case "characters":
      return characterFormConfig
    case "locations":
      return locationFormConfig
    case "lore":
      return loreFormConfig
    case "plot":
      return plotFormConfig
    default:
      throw new Error(`Form configuration not implemented for ${entryType}`)
  }
}

interface DynamicCodexFormProps {
  entry: Character | Location | LoreEntry | PlotThread
  projectId: string
  entryType: "characters" | "locations" | "lore" | "plot"
  onSave: () => void
  onCancel: () => void
}

// Create default values from entry data
const createDefaultValues = (
  entryData: Character | Location | LoreEntry | PlotThread,
  fields: CodexFormField[]
) => {
  const defaults: Record<string, unknown> = {}
  for (const field of fields) {
    const value = (entryData as unknown as Record<string, unknown>)[field.name]
    // For select fields, preserve null/undefined as empty string to allow clearing
    defaults[field.name] = value ?? ""
  }
  return defaults
}

export function DynamicCodexForm({
  entry,
  projectId,
  entryType,
  onSave,
  onCancel,
}: DynamicCodexFormProps) {
  const queryClient = useQueryClient()

  const formConfig = useMemo(() => getFormConfig(entryType), [entryType])
  const schema = useMemo(() => createDynamicSchema(formConfig), [formConfig])
  const defaultValues = useMemo(() => createDefaultValues(entry, formConfig), [entry, formConfig])

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>): Promise<unknown> => {
      if (entryType === "characters") {
        return api.characters.update(projectId, entry.id, data)
      }
      if (entryType === "locations") {
        return api.locations.update(projectId, entry.id, data)
      }
      if (entryType === "lore") {
        return api.lore.update(projectId, entry.id, data)
      }
      if (entryType === "plot") {
        return api.plot.update(projectId, entry.id, data)
      }
      throw new Error(`Update not implemented for ${entryType}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entryType, projectId] })
      toast.success(`${entryType.slice(0, -1)} updated successfully!`)
      onSave()
    },
    onError: (error) => {
      toast.error(`Failed to update ${entryType.slice(0, -1)}: ${error.message}`)
    },
  })

  const onSubmit = (data: Record<string, unknown>) => {
    updateMutation.mutate(data)
  }

  const renderField = (field: CodexFormField) => {
    switch (field.type) {
      case "text":
        return (
          <FormField
            control={form.control}
            key={field.name}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label} {field.required && "*"}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={field.placeholder}
                    {...formField}
                    value={formField.value as string}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case "textarea":
        return (
          <FormField
            control={form.control}
            key={field.name}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label} {field.required && "*"}
                </FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-[80px]"
                    placeholder={field.placeholder}
                    {...formField}
                    value={formField.value as string}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case "select":
        return (
          <FormField
            control={form.control}
            key={field.name}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label} {field.required && "*"}
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    // Allow clearing the value by passing empty string
                    formField.onChange(value === "clear" ? "" : value)
                  }}
                  value={(formField.value as string) || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Add clear option if field is not required */}
                    {!field.required && (
                      <SelectItem value="clear">
                        <span className="text-muted-foreground italic">Clear selection</span>
                      </SelectItem>
                    )}
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      case "number":
        return (
          <FormField
            control={form.control}
            key={field.name}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>
                  {field.label} {field.required && "*"}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={field.placeholder}
                    type="number"
                    {...formField}
                    onChange={(e) => {
                      const value = e.target.value
                      // Allow clearing the input, otherwise parse as a number.
                      formField.onChange(value === "" ? null : Number.parseInt(value, 10))
                    }}
                    value={formField.value as string}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )

      default:
        return null
    }
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4">{formConfig.map((field) => renderField(field))}</div>

        <div className="flex justify-end gap-2">
          <Button
            disabled={updateMutation.isPending}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={updateMutation.isPending} type="submit">
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
