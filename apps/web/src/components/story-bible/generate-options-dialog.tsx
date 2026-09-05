import { useMutation } from "@tanstack/react-query"
import { Check, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"

interface GenerateOptionsDialogProps {
  description?: string
  onGenerate: (instructions?: string) => Promise<string[]>
  onOpenChange: (open: boolean) => void
  onPick: (text: string) => void
  open: boolean
  title: string
}

/**
 * Sudowrite-style "give me options" flow: the writer optionally adds a steer,
 * hits Generate, and picks one of several cards to drop into the field.
 */
export function GenerateOptionsDialog({
  open,
  onOpenChange,
  onPick,
  onGenerate,
  title,
  description,
}: GenerateOptionsDialogProps) {
  const [instructions, setInstructions] = useState("")
  const [options, setOptions] = useState<string[]>([])

  useEffect(() => {
    if (open) {
      setInstructions("")
      setOptions([])
    }
  }, [open])

  const generate = useMutation({
    mutationFn: () => onGenerate(instructions.trim() || undefined),
    onSuccess: (result) => {
      if (result.length === 0) {
        toast.error("The model returned nothing usable. Try again with a steer.")
        return
      }
      setOptions(result)
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="generate-instructions">Steer the AI (optional)</Label>
          <Textarea
            className="min-h-[70px]"
            id="generate-instructions"
            onChange={(event) => setInstructions(event.target.value)}
            placeholder="e.g. keep it dark, focus on her childhood, one paragraph only…"
            value={instructions}
          />
        </div>

        <Button
          className="w-full"
          disabled={generate.isPending}
          onClick={() => generate.mutate()}
          type="button"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {(() => {
            if (generate.isPending) {
              return "Generating…"
            }
            return options.length > 0 ? "Regenerate" : "Generate options"
          })()}
        </Button>

        {generate.isPending && (
          <div className="space-y-3">
            {[0, 1, 2].map((n) => (
              <Skeleton className="h-20 w-full" key={n} />
            ))}
          </div>
        )}

        {!generate.isPending && options.length > 0 && (
          <div className="space-y-3">
            {options.map((option, index) => (
              <button
                className="w-full rounded-md border p-3 text-left text-sm transition-colors hover:border-primary hover:bg-accent"
                // biome-ignore lint/suspicious/noArrayIndexKey: options are positional and regenerated as a block
                key={index}
                onClick={() => {
                  onPick(option)
                  onOpenChange(false)
                }}
                type="button"
              >
                <div className="mb-1 flex items-center gap-2 font-medium text-muted-foreground text-xs">
                  <Check className="h-3 w-3" />
                  Option {index + 1}
                </div>
                <p className="whitespace-pre-wrap">{option}</p>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
