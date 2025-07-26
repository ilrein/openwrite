import { useQuery } from "@tanstack/react-query"
import { ChevronDown, Sparkles } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { type AiProvider, aiProvidersApi } from "@/lib/api/ai-providers"

interface Model {
  id: string
  name: string
  provider: string
  providerLabel: string
}

interface AutocompleteToggleProps {
  isEnabled?: boolean
  onToggle?: (enabled: boolean) => void
  selectedModel?: string
  onModelChange?: (model: string, provider: string) => void
}

export function AutocompleteToggle({
  isEnabled = false,
  onToggle,
  selectedModel,
  onModelChange,
}: AutocompleteToggleProps) {
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(isEnabled)

  // Fetch AI providers
  const { data: providers, isLoading } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: () => aiProvidersApi.list(),
  })

  const allProviders = providers || []
  const activeProviders = allProviders.filter((p: AiProvider) => p.isActive)
  const hasActiveProviders = activeProviders.length > 0

  // Get all available models from active providers
  const availableModels: Model[] = activeProviders.flatMap((provider: AiProvider) => {
    // Type assertion since supportedModels isn't in the base type but exists in the data
    const providerWithModels = provider as AiProvider & { supportedModels?: string[] }
    const models = providerWithModels.supportedModels || []
    return models.map((model: string) => ({
      id: model,
      name: model,
      provider: provider.provider,
      providerLabel: provider.keyLabel || provider.provider,
    }))
  })

  const handleToggle = (enabled: boolean) => {
    setAutocompleteEnabled(enabled)
    onToggle?.(enabled)
  }

  const handleModelSelect = (modelId: string, provider: string) => {
    onModelChange?.(modelId, provider)
  }

  const currentModel = availableModels.find((m: Model) => m.id === selectedModel)

  // Helper functions to avoid nested ternaries
  const getTooltipMessage = () => {
    if (!hasActiveProviders) {
      return "Connect an AI provider to enable autocomplete"
    }
    return autocompleteEnabled
      ? "Disable AI autocomplete suggestions"
      : "Enable AI autocomplete suggestions"
  }

  const renderButtonContent = () => {
    if (currentModel) {
      return (
        <>
          <span className="max-w-24 truncate">{currentModel.name}</span>
          <span className="text-muted-foreground">({currentModel.providerLabel})</span>
        </>
      )
    }
    return "Select model"
  }

  const renderDropdownContent = () => {
    if (isLoading) {
      return <DropdownMenuItem disabled>Loading models...</DropdownMenuItem>
    }

    if (availableModels.length === 0) {
      return <DropdownMenuItem disabled>No models available</DropdownMenuItem>
    }

    return renderModelsByProvider()
  }

  const renderModelsByProvider = () => {
    const providerGroups = availableModels.reduce(
      (groups: Record<string, Model[]>, model: Model) => {
        const key = model.providerLabel
        if (!groups[key]) {
          groups[key] = []
        }
        groups[key].push(model)
        return groups
      },
      {} as Record<string, Model[]>
    )

    return Object.entries(providerGroups).map(([providerLabel, models], index) => {
      return (
        <div key={providerLabel}>
          {index > 0 && <DropdownMenuSeparator />}
          <DropdownMenuLabel className="text-muted-foreground text-xs">
            {providerLabel}
          </DropdownMenuLabel>
          {models.map((model) => {
            return (
              <DropdownMenuItem
                className="cursor-pointer"
                key={`${model.provider}-${model.id}`}
                onClick={() => handleModelSelect(model.id, model.provider)}
              >
                <div className="flex flex-col">
                  <span className="text-sm">{model.name}</span>
                </div>
              </DropdownMenuItem>
            )
          })}
        </div>
      )
    })
  }

  return (
    <div className="flex flex-row items-center justify-center gap-3">
      {/* Autocomplete Toggle */}
      <div className="flex flex-row items-center gap-2">
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Autocomplete</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Switch
                checked={autocompleteEnabled}
                disabled={!hasActiveProviders || isLoading}
                onCheckedChange={handleToggle}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">{getTooltipMessage()}</TooltipContent>
        </Tooltip>
      </div>

      {/* Model Selection Dropdown */}
      {autocompleteEnabled && hasActiveProviders && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="h-8 gap-1 px-2 text-xs"
              disabled={!hasActiveProviders || isLoading}
              size="sm"
              variant="outline"
            >
              {renderButtonContent()}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Select AI Model</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {renderDropdownContent()}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
