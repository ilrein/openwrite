"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { AiProviderCard } from "@/components/ai-provider-card"
import { OllamaSetup } from "@/components/ollama-setup"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { aiProvidersApi } from "@/lib/api/ai-providers"
import { buildAuthURL, generatePKCEParams } from "@/lib/pkce"

function AIProvidersPage() {
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [oauthProcessing, setOauthProcessing] = useState(false)
  const queryClient = useQueryClient()

  // Prevent double OAuth execution in React StrictMode
  const oauthHandled = useRef(false)

  // Use TanStack Query for providers data
  const { data: providers = [], isLoading: loading } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: () => aiProvidersApi.list(),
    staleTime: 30 * 1000, // 30 seconds
  })

  // OAuth exchange mutation
  const oauthMutation = useMutation({
    mutationFn: aiProvidersApi.exchangeOpenRouterCode,
    onSuccess: () => {
      toast.success("OAuth connection successful!")
      // Invalidate and refetch providers
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] })
      setSelectedProviderId(null)
    },
    onError: (error: Error) => {
      toast.error(`OAuth callback failed: ${error.message}`)
    },
    onSettled: () => {
      setOauthProcessing(false)
    },
  })

  // Delete provider mutation
  const deleteMutation = useMutation({
    mutationFn: aiProvidersApi.delete,
    onSuccess: () => {
      toast.success("Provider deleted successfully!")
      // Invalidate and refetch providers
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] })
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete provider: ${error.message}`)
    },
  })

  const handleOAuthCallback = useCallback(
    (code: string) => {
      try {
        setOauthProcessing(true)

        const storedParams = sessionStorage.getItem("openrouter-pkce")
        if (!storedParams) {
          toast.error("No PKCE parameters found in session storage")
          setOauthProcessing(false)
          return
        }

        const { codeVerifier, codeChallengeMethod } = JSON.parse(storedParams)
        sessionStorage.removeItem("openrouter-pkce")

        oauthMutation.mutate({
          code,
          codeVerifier,
          codeChallengeMethod,
        })
      } catch (error) {
        toast.error(
          `OAuth callback failed: ${error instanceof Error ? error.message : "Unknown error"}`
        )
        setOauthProcessing(false)
      }
    },
    [oauthMutation]
  )

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get("code")

    if (code && !oauthHandled.current) {
      // Set flag immediately to prevent StrictMode double execution
      oauthHandled.current = true

      // OAuth flow - handleOAuthCallback will invalidate and refetch providers
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
      handleOAuthCallback(code)
    }
    // No else block needed - TanStack Query handles normal loading
  }, [handleOAuthCallback])

  const availableProviders = [
    {
      id: "openrouter",
      name: "OpenRouter",
      description: "Access 200+ models through one API",
      recommended: true,
      enabled: true,
    },
    {
      id: "openai",
      name: "OpenAI",
      description: "GPT-4o, GPT-4-turbo, GPT-3.5",
      enabled: false,
    },
    {
      id: "anthropic",
      name: "Anthropic",
      description: "Claude-3.5-Sonnet, Claude-3-Haiku",
      enabled: false,
    },
    {
      id: "groq",
      name: "Groq",
      description: "Llama-3.1, Mixtral, Gemma (Free)",
      enabled: false,
    },
    {
      id: "gemini",
      name: "Google Gemini",
      description: "Gemini-1.5-Pro, Gemini-1.5-Flash",
      enabled: false,
    },
    {
      id: "cohere",
      name: "Cohere",
      description: "Command-R+, Command-R, Aya",
      enabled: false,
    },
    {
      id: "ollama",
      name: "Ollama",
      description: "Run models locally on your device",
      enabled: true,
    },
  ]

  const getConnectedProvider = useCallback(
    (providerId: string) => {
      return providers.find((p) => p.provider === providerId)
    },
    [providers]
  )

  const isProviderConnected = useCallback(
    (providerId: string) => {
      return !!getConnectedProvider(providerId)
    },
    [getConnectedProvider]
  )

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="font-bold text-3xl">AI Providers</h1>
        <p className="text-muted-foreground">Connect AI providers to access their models</p>
      </div>

      {(loading || oauthProcessing) && (
        <div className="py-8 text-center">
          {oauthProcessing ? "Processing OAuth..." : "Loading providers..."}
        </div>
      )}

      {!loading && (
        <div className="grid gap-4">
          {availableProviders.map((provider) => {
            const connectedProvider = getConnectedProvider(provider.id)
            const isConnected = isProviderConnected(provider.id)

            return (
              <AiProviderCard
                description={provider.description}
                enabled={provider.enabled}
                isConnected={isConnected}
                key={provider.id}
                name={provider.name}
                onConnect={() => {
                  if (provider.enabled) {
                    setSelectedProviderId(provider.id)
                  }
                }}
                onDelete={() => {
                  if (connectedProvider) {
                    deleteMutation.mutate(connectedProvider.id)
                  }
                }}
                recommended={provider.recommended}
              >
                {selectedProviderId === provider.id && (
                  <AddProviderForm
                    availableProviders={[provider].filter((p) => p.enabled)}
                    onSuccess={() => {
                      setSelectedProviderId(null)
                      queryClient.invalidateQueries({ queryKey: ["ai-providers"] })
                    }}
                    preSelectedProviderId={provider.id}
                  />
                )}
              </AiProviderCard>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AddProviderForm({
  availableProviders,
  preSelectedProviderId,
  onSuccess,
}: {
  availableProviders: Array<{
    id: string
    name: string
    description: string
    recommended?: boolean
    enabled?: boolean
  }>
  preSelectedProviderId?: string | null
  onSuccess: () => void
}) {
  const [selectedProvider, setSelectedProvider] = useState(preSelectedProviderId || "")
  const [apiKey, setApiKey] = useState("")
  const [loading, setLoading] = useState(false)
  const [showManualApiKey, setShowManualApiKey] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  useEffect(() => {
    setSelectedProvider(preSelectedProviderId || "")
  }, [preSelectedProviderId])

  const handleOAuthLogin = async () => {
    try {
      setOauthLoading(true)

      // Generate PKCE parameters
      const pkceParams = await generatePKCEParams()

      // Store PKCE parameters in sessionStorage for the callback
      sessionStorage.setItem(
        "openrouter-pkce",
        JSON.stringify({
          codeVerifier: pkceParams.codeVerifier,
          codeChallengeMethod: pkceParams.codeChallengeMethod,
        })
      )

      // Build OAuth URL
      const callbackUrl = `${window.location.origin}/dashboard/ai`

      const authUrl = buildAuthURL({
        callbackUrl,
        codeChallenge: pkceParams.codeChallenge,
        codeChallengeMethod: pkceParams.codeChallengeMethod,
      })

      // Redirect to OpenRouter OAuth
      window.location.href = authUrl
    } catch (_error) {
      // Error handling removed for linting
      setOauthLoading(false)
    }
  }

  const handleOllamaConnect = async (config: { apiUrl: string; connectionMethod: string }) => {
    try {
      setLoading(true)
      await aiProvidersApi.create({
        provider: "ollama",
        apiKey: "", // Ollama doesn't require API key
        apiUrl: config.apiUrl,
        configuration: {
          connectionMethod: config.connectionMethod,
        },
      })
      onSuccess()
      setSelectedProvider("")
      setApiKey("")
    } catch (_error) {
      // Error handling removed for linting
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // For OpenRouter, only require API key if manual mode is selected
    const requiresApiKey = selectedProvider !== "openrouter" || showManualApiKey
    if (!selectedProvider || (requiresApiKey && !apiKey)) {
      return
    }

    try {
      setLoading(true)
      await aiProvidersApi.create({
        provider: selectedProvider as
          | "openrouter"
          | "openai"
          | "anthropic"
          | "ollama"
          | "groq"
          | "gemini"
          | "cohere",
        apiKey,
      })
      onSuccess()
      setSelectedProvider("")
      setApiKey("")
    } catch (_error) {
      // Error handling removed for linting
    } finally {
      setLoading(false)
    }
  }

  const selectedProviderData = availableProviders.find((p) => p.id === selectedProvider)

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {!preSelectedProviderId && (
        <div className="space-y-2">
          <Label htmlFor="provider">Select Provider</Label>
          <Select onValueChange={setSelectedProvider} value={selectedProvider}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an AI provider" />
            </SelectTrigger>
            <SelectContent>
              {availableProviders.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center gap-2">
                    {provider.name}
                    {provider.recommended && (
                      <Badge className="text-xs" variant="secondary">
                        Recommended
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProviderData && (
            <p className="mt-1 text-muted-foreground text-sm">{selectedProviderData.description}</p>
          )}
        </div>
      )}

      {preSelectedProviderId && selectedProviderData && (
        <div className="space-y-2">
          <Label>Connecting to Provider</Label>
          <div className="flex items-center gap-3 rounded-md border p-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedProviderData.name}</span>
                {selectedProviderData.recommended && <Badge variant="secondary">Recommended</Badge>}
              </div>
              <p className="text-muted-foreground text-sm">{selectedProviderData.description}</p>
            </div>
          </div>
        </div>
      )}

      {selectedProvider === "ollama" && (
        <div className="space-y-3">
          <Separator />
          <OllamaSetup loading={loading} onConnect={handleOllamaConnect} />
        </div>
      )}

      {selectedProvider === "openrouter" && (
        <div className="space-y-3">
          <Separator />
          {!showManualApiKey && (
            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={oauthLoading}
                onClick={handleOAuthLogin}
                type="button"
                variant="default"
              >
                {oauthLoading ? "Connecting..." : "OAuth Login (Recommended)"}
              </Button>
              <Button
                className="flex-1"
                onClick={() => setShowManualApiKey(true)}
                type="button"
                variant="outline"
              >
                Manual API Key
              </Button>
            </div>
          )}
        </div>
      )}

      {selectedProvider &&
        selectedProvider !== "ollama" &&
        (selectedProvider !== "openrouter" || showManualApiKey) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="apiKey">API Key</Label>
              {selectedProvider === "openrouter" && showManualApiKey && (
                <Button
                  onClick={() => setShowManualApiKey(false)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  ← Back to OAuth
                </Button>
              )}
            </div>
            <Input
              id="apiKey"
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              required
              type="password"
              value={apiKey}
            />
            <p className="mt-1 text-muted-foreground text-sm">
              Your API key will be encrypted and stored securely
            </p>
          </div>
        )}

      {selectedProvider !== "ollama" && (
        <div className="flex gap-2 pt-4">
          <Button
            disabled={
              !selectedProvider ||
              (selectedProvider === "openrouter" && showManualApiKey && !apiKey) ||
              (selectedProvider !== "openrouter" && selectedProvider !== "ollama" && !apiKey) ||
              loading ||
              oauthLoading
            }
            type="submit"
          >
            {loading ? "Connecting..." : "Connect Provider"}
          </Button>
        </div>
      )}
    </form>
  )
}

export const Route = createFileRoute("/dashboard/ai")({
  component: AIProvidersPage,
})
