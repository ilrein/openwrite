import { Plus, Sparkles, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { newTrait, type Trait } from "@/lib/api"
import { GenerateOptionsDialog } from "./generate-options-dialog"

interface TraitEditorProps {
  canGenerate: boolean
  onChange: (traits: Trait[]) => void
  onGenerateTrait: (label: string, instructions?: string) => Promise<string[]>
  subjectName: string
  traits: Trait[]
}

/**
 * The stack of labeled trait fields on a character / worldbuilding card. Labels
 * are editable (so a writer can rename or add their own), each value has an
 * "AI options" button, and "Add a trait" appends a blank row.
 */
export function TraitEditor({
  traits,
  onChange,
  onGenerateTrait,
  canGenerate,
  subjectName,
}: TraitEditorProps) {
  const [generatingTraitId, setGeneratingTraitId] = useState<string | null>(null)

  const updateTrait = (id: string, patch: Partial<Trait>) => {
    onChange(traits.map((trait) => (trait.id === id ? { ...trait, ...patch } : trait)))
  }

  const removeTrait = (id: string) => {
    onChange(traits.filter((trait) => trait.id !== id))
  }

  const activeTrait = traits.find((trait) => trait.id === generatingTraitId)

  return (
    <div className="space-y-4">
      {traits.map((trait) => (
        <div className="space-y-1.5" key={trait.id}>
          <div className="flex items-center gap-2">
            <Input
              aria-label="Trait name"
              className="h-8 max-w-[16rem] font-medium text-sm"
              onChange={(event) => updateTrait(trait.id, { label: event.target.value })}
              placeholder="Trait name"
              value={trait.label}
            />
            <div className="ml-auto flex items-center gap-1">
              <Button
                className="h-8"
                disabled={!(canGenerate && trait.label.trim())}
                onClick={() => setGeneratingTraitId(trait.id)}
                size="sm"
                title={canGenerate ? "Generate options" : "Save first to use AI"}
                type="button"
                variant="ghost"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button
                aria-label={`Remove ${trait.label || "trait"}`}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeTrait(trait.id)}
                size="sm"
                type="button"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Textarea
            className="min-h-[64px]"
            onChange={(event) => updateTrait(trait.id, { value: event.target.value })}
            placeholder={`${trait.label || "Notes"}…`}
            value={trait.value}
          />
        </div>
      ))}

      <Button
        className="text-muted-foreground"
        onClick={() => onChange([...traits, newTrait()])}
        size="sm"
        type="button"
        variant="outline"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add a trait
      </Button>

      {activeTrait && (
        <GenerateOptionsDialog
          description={`Draft "${activeTrait.label}" for ${subjectName || "this entry"}.`}
          onGenerate={(instructions) => onGenerateTrait(activeTrait.label, instructions)}
          onOpenChange={(open) => !open && setGeneratingTraitId(null)}
          onPick={(text) => updateTrait(activeTrait.id, { value: text })}
          open={Boolean(activeTrait)}
          title={`Generate: ${activeTrait.label}`}
        />
      )}
    </div>
  )
}
