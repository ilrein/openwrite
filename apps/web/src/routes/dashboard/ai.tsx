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

type AIProvider = {
  id: string
  name: string
  description: string
  recommended?: boolean
  enabled: boolean
  supportsPKCE?: boolean
}

interface ProviderFormProps {
  selectedProvider: string
  setSelectedProvider: (provider: string) => void
  apiKey: string
  setApiKey: (key: string) => void
  loading: boolean
  oauthLoading: boolean
  showManualApiKey: boolean
  setShowManualApiKey: (show: boolean) => void
  availableProviders: AIProvider[]
  preSelectedProviderId?: string | null
  selectedProviderData: AIProvider | undefined
  selectedProviderSupportsPKCE: boolean
  handleSubmit: (e: React.FormEvent) => void
  handleOAuthLogin: () => void
  handleOllamaConnect?: (config: { apiUrl: string; connectionMethod: string }) => void
}

function AIProvidersPage() {
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [_oauthProcessing, setOauthProcessing] = useState(false)
  const queryClient = useQueryClient()

  // Prevent double OAuth execution in React StrictMode
  const oauthHandled = useRef(false)

  const { data: providers, error } = useQuery({
    queryKey: ["ai-providers"],
    queryFn: () => aiProvidersApi.list(),
  })

  if (error) {
    toast.error(`Failed to load AI providers: ${error.message}`)
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aiProvidersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] })
      toast.success("Provider disconnected successfully")
    },
    onError: (deleteError: Error) => {
      toast.error(`Failed to disconnect provider: ${deleteError.message}`)
    },
  })

  const oauthMutation = useMutation({
    mutationFn: (params: {
      code: string
      codeVerifier: string
      codeChallengeMethod: "S256" | "plain"
    }) => aiProvidersApi.exchangeOpenRouterCode(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-providers"] })
      toast.success("Provider connected successfully via OAuth")
      setOauthProcessing(false)
    },
    onError: (oauthError: Error) => {
      toast.error(`OAuth connection failed: ${oauthError.message}`)
      setOauthProcessing(false)
    },
  })

  const handleOAuthCallback = useCallback(
    (code: string) => {
      try {
        setOauthProcessing(true)

        // Find PKCE params for any provider
        let storedParams: string | null = null
        let pkceKey: string | null = null

        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i)
          if (key?.endsWith("-pkce")) {
            storedParams = sessionStorage.getItem(key)
            pkceKey = key
            break
          }
        }

        if (!(storedParams && pkceKey)) {
          toast.error("No PKCE parameters found in session storage")
          setOauthProcessing(false)
          return
        }

        const {
          codeVerifier,
          codeChallengeMethod,
        }: { codeVerifier: string; codeChallengeMethod: "S256" | "plain" } =
          JSON.parse(storedParams)
        sessionStorage.removeItem(pkceKey)

        oauthMutation.mutate({
          code,
          codeVerifier,
          codeChallengeMethod,
        })
      } catch (callbackError) {
        toast.error(
          `OAuth callback failed: ${callbackError instanceof Error ? callbackError.message : "Unknown error"}`
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
      oauthHandled.current = true
      // OAuth flow - handleOAuthCallback will invalidate and refetch providers
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
      handleOAuthCallback(code)
    }
    // No else block needed - TanStack Query handles normal loading
  }, [handleOAuthCallback])

  const availableProviders: AIProvider[] = [
    {
      id: "openrouter",
      name: "OpenRouter",
      description: "Access 200+ models through one API",
      recommended: true,
      enabled: true,
      supportsPKCE: true,
    },
    {
      id: "openai",
      name: "OpenAI",
      description: "GPT-4o, GPT-4-turbo, GPT-3.5",
      enabled: false,
      supportsPKCE: false,
    },
    {
      id: "anthropic",
      name: "Anthropic",
      description: "Claude-3.5-Sonnet, Claude-3-Haiku",
      enabled: true,
      supportsPKCE: false,
    },
    {
      id: "groq",
      name: "Groq",
      description: "Llama-3.1, Mixtral, Gemma (Free)",
      enabled: false,
      supportsPKCE: false,
    },
    {
      id: "gemini",
      name: "Google Gemini",
      description: "Gemini-1.5-Pro, Gemini-1.5-Flash",
      enabled: false,
      supportsPKCE: false,
    },
    {
      id: "cohere",
      name: "Cohere",
      description: "Command-R+, Command-R, Aya",
      enabled: false,
      supportsPKCE: false,
    },
    {
      id: "ollama",
      name: "Ollama",
      description: "Run models locally on your device",
      enabled: true,
      supportsPKCE: false,
    },
  ]

  const getConnectedProvider = useCallback(
    (providerId: string) => {
      return providers?.find((p) => p.provider === providerId)
    },
    [providers]
  )

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl">AI Providers</h1>
        <p className="text-muted-foreground">
          Connect your AI providers to start generating content
        </p>
      </div>

      {providers && providers.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Connected Providers</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <AiProviderCard
                description={
                  availableProviders.find((p) => p.id === provider.provider)?.description ||
                  "AI Provider"
                }
                enabled={true}
                isConnected={true}
                key={provider.id}
                name={
                  availableProviders.find((p) => p.id === provider.provider)?.name ||
                  provider.provider
                }
                onConnect={() => {
                  /* Connected providers don't need connect action */
                }}
                onDelete={() => deleteMutation.mutate(provider.id)}
                recommended={
                  availableProviders.find((p) => p.id === provider.provider)?.recommended
                }
              />
            ))}
          </div>
        </div>
      )}

      {availableProviders.some((p) => p.enabled) && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Available Providers</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableProviders.map((provider) => {
              const connectedProvider = getConnectedProvider(provider.id)
              const isConnected = !!connectedProvider

              return (
                <AiProviderCard
                  description={provider.description}
                  enabled={provider.enabled}
                  isConnected={isConnected}
                  key={provider.id}
                  name={provider.name}
                  onConnect={() => {
                    if (!isConnected) {
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
        </div>
      )}
    </div>
  )
}

function useOAuthLogin(options: {
  providerId: string
  setOauthLoading: (loading: boolean) => void
}) {
  const { providerId, setOauthLoading } = options

  return async () => {
    try {
      setOauthLoading(true)

      const pkceParams = await generatePKCEParams()

      sessionStorage.setItem(
        `${providerId}-pkce`,
        JSON.stringify({
          codeVerifier: pkceParams.codeVerifier,
          codeChallengeMethod: pkceParams.codeChallengeMethod,
          providerId,
        })
      )

      const callbackUrl = `${window.location.origin}/dashboard/ai`
      const authUrl = buildAuthURL({
        callbackUrl,
        codeChallenge: pkceParams.codeChallenge,
        codeChallengeMethod: pkceParams.codeChallengeMethod,
      })

      window.location.href = authUrl
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to initiate OAuth"
      toast.error(errorMessage)
      setOauthLoading(false)
    }
  }
}

function useProviderSubmit(options: {
  selectedProvider: string
  selectedProviderSupportsPKCE: boolean
  showManualApiKey: boolean
  apiKey: string
  onSuccess: () => void
  setLoading: (loading: boolean) => void
  setSelectedProvider: (provider: string) => void
  setApiKey: (key: string) => void
}) {
  const {
    selectedProvider,
    selectedProviderSupportsPKCE,
    showManualApiKey,
    apiKey,
    onSuccess,
    setLoading,
    setSelectedProvider,
    setApiKey,
  } = options
  return async (e: React.FormEvent) => {
    e.preventDefault()

    const requiresApiKey = !selectedProviderSupportsPKCE || showManualApiKey
    if (!selectedProvider || (requiresApiKey && !apiKey && selectedProvider !== "ollama")) {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect provider"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }
}

function AddProviderForm({
  availableProviders,
  preSelectedProviderId,
  onSuccess,
}: {
  availableProviders: AIProvider[]
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

  const selectedProviderData = availableProviders.find((p) => p.id === selectedProvider)
  const selectedProviderSupportsPKCE = selectedProviderData?.supportsPKCE ?? false

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
    } catch (error) {
      toast.error(
        `Failed to connect Ollama: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    } finally {
      setLoading(false)
    }
  }
  const handleOAuthLogin = useOAuthLogin({
    providerId: selectedProvider,
    setOauthLoading,
  })
  const handleSubmit = useProviderSubmit({
    selectedProvider,
    selectedProviderSupportsPKCE,
    showManualApiKey,
    apiKey,
    onSuccess,
    setLoading,
    setSelectedProvider,
    setApiKey,
  })

  return (
    <ProviderForm
      apiKey={apiKey}
      availableProviders={availableProviders}
      handleOAuthLogin={handleOAuthLogin}
      handleOllamaConnect={handleOllamaConnect}
      handleSubmit={handleSubmit}
      loading={loading}
      oauthLoading={oauthLoading}
      preSelectedProviderId={preSelectedProviderId}
      selectedProvider={selectedProvider}
      selectedProviderData={selectedProviderData}
      selectedProviderSupportsPKCE={selectedProviderSupportsPKCE}
      setApiKey={setApiKey}
      setSelectedProvider={setSelectedProvider}
      setShowManualApiKey={setShowManualApiKey}
      showManualApiKey={showManualApiKey}
    />
  )
}

function ProviderSelector({
  selectedProvider,
  setSelectedProvider,
  availableProviders,
  selectedProviderData,
}: {
  selectedProvider: string
  setSelectedProvider: (provider: string) => void
  availableProviders: AIProvider[]
  selectedProviderData: AIProvider | undefined
}) {
  return (
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
  )
}

function ProviderInfo({ selectedProviderData }: { selectedProviderData: AIProvider }) {
  return (
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
  )
}

function OAuthSection({
  oauthLoading,
  showManualApiKey,
  setShowManualApiKey,
  handleOAuthLogin,
}: {
  oauthLoading: boolean
  showManualApiKey: boolean
  setShowManualApiKey: (show: boolean) => void
  handleOAuthLogin: () => void
}) {
  return (
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
  )
}

function ApiKeySection({
  apiKey,
  setApiKey,
  selectedProviderSupportsPKCE,
  showManualApiKey,
  setShowManualApiKey,
}: {
  apiKey: string
  setApiKey: (key: string) => void
  selectedProviderSupportsPKCE: boolean
  showManualApiKey: boolean
  setShowManualApiKey: (show: boolean) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="apiKey">API Key</Label>
        {selectedProviderSupportsPKCE && showManualApiKey && (
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
  )
}

function ProviderForm({
  selectedProvider,
  setSelectedProvider,
  apiKey,
  setApiKey,
  loading,
  oauthLoading,
  showManualApiKey,
  setShowManualApiKey,
  availableProviders,
  preSelectedProviderId,
  selectedProviderData,
  selectedProviderSupportsPKCE,
  handleSubmit,
  handleOAuthLogin,
  handleOllamaConnect,
}: ProviderFormProps) {
  // Extract button state logic for better readability
  const hasSelectedProvider = !!selectedProvider
  const canUseOAuth = selectedProviderSupportsPKCE && !showManualApiKey
  const hasApiKeyForNonPKCE =
    !selectedProviderSupportsPKCE && apiKey && selectedProvider !== "ollama"
  const hasApiKeyForManualMode = selectedProviderSupportsPKCE && showManualApiKey && apiKey
  const isOllama = selectedProvider === "ollama"

  const isFormValid =
    hasSelectedProvider &&
    (canUseOAuth || hasApiKeyForNonPKCE || hasApiKeyForManualMode || isOllama)
  const isSubmitDisabled = !isFormValid || loading || oauthLoading
  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {!preSelectedProviderId && (
        <ProviderSelector
          availableProviders={availableProviders}
          selectedProvider={selectedProvider}
          selectedProviderData={selectedProviderData}
          setSelectedProvider={setSelectedProvider}
        />
      )}

      {preSelectedProviderId && selectedProviderData && (
        <ProviderInfo selectedProviderData={selectedProviderData} />
      )}

      {selectedProvider === "ollama" && handleOllamaConnect && (
        <div className="space-y-3">
          <Separator />
          <OllamaSetup loading={loading} onConnect={handleOllamaConnect} />
        </div>
      )}

      {selectedProviderSupportsPKCE && (
        <OAuthSection
          handleOAuthLogin={handleOAuthLogin}
          oauthLoading={oauthLoading}
          setShowManualApiKey={setShowManualApiKey}
          showManualApiKey={showManualApiKey}
        />
      )}

      {selectedProvider &&
        selectedProvider !== "ollama" &&
        (!selectedProviderSupportsPKCE || showManualApiKey) && (
          <ApiKeySection
            apiKey={apiKey}
            selectedProviderSupportsPKCE={selectedProviderSupportsPKCE}
            setApiKey={setApiKey}
            setShowManualApiKey={setShowManualApiKey}
            showManualApiKey={showManualApiKey}
          />
        )}

      {selectedProvider !== "ollama" && (
        <div className="flex gap-2 pt-4">
          <Button disabled={isSubmitDisabled} type="submit">
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
