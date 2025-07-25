"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { OllamaSetup } from "@/components/ollama-setup"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { aiProvidersApi, type ProviderId } from "@/lib/api/ai-providers"
import { buildAuthURL, generatePKCEParams } from "@/lib/pkce"

type AIProvider = {
  id: ProviderId
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
      provider: ProviderId
    }) => aiProvidersApi.exchangeOAuth(params),
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
          providerId,
        }: {
          codeVerifier: string
          codeChallengeMethod: "S256" | "plain"
          providerId: ProviderId
        } = JSON.parse(storedParams)
        sessionStorage.removeItem(pkceKey)

        oauthMutation.mutate({
          code,
          codeVerifier,
          codeChallengeMethod,
          provider: providerId,
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

  // Performance optimization: Create Map for O(1) provider lookups
  const providersMap = useMemo(() => {
    return new Map(availableProviders.map((provider) => [provider.id, provider]))
  }, [])

  const getConnectedProvider = useCallback(
    (providerId: string) => {
      return providers?.find((p) => p.provider === providerId)
    },
    [providers]
  )

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="font-bold text-2xl sm:text-3xl">AI Providers</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Connect your AI providers to start generating content
        </p>
      </div>

      {providers && providers.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg sm:text-xl">Connected Providers</h2>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-32">Provider</TableHead>
                  <TableHead className="min-w-48">Description</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => {
                  const providerData = providersMap.get(provider.provider)
                  return (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {providerData?.name || provider.provider}
                          </span>
                          {providerData?.recommended && (
                            <Badge className="text-xs" variant="secondary">
                              Recommended
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {providerData?.description || "AI Provider"}
                      </TableCell>
                      <TableCell>
                        <Badge className="text-xs" variant="default">
                          Connected
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ConfirmDialog
                          confirmText="Delete"
                          description="Are you sure you want to delete this AI provider? This action cannot be undone."
                          onConfirm={() => deleteMutation.mutate(provider.id)}
                          title="Delete AI Provider"
                          variant="destructive"
                        >
                          <Button size="sm" variant="destructive">
                            Delete
                          </Button>
                        </ConfirmDialog>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {availableProviders.some((p) => p.enabled) && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg sm:text-xl">Available Providers</h2>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-32">Provider</TableHead>
                  <TableHead className="min-w-48">Description</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableProviders
                  .filter((p) => p.enabled && !getConnectedProvider(p.id)) // Only show non-connected providers
                  .sort((a, b) => {
                    // Sort by recommended status first, then alphabetically
                    if (a.recommended && !b.recommended) {
                      return -1
                    }
                    if (!a.recommended && b.recommended) {
                      return 1
                    }

                    // Finally alphabetically
                    return a.name.localeCompare(b.name)
                  })
                  .map((provider) => {
                    return (
                      <TableRow key={provider.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{provider.name}</span>
                            {provider.recommended && (
                              <Badge className="text-xs" variant="secondary">
                                Recommended
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {provider.description}
                        </TableCell>
                        <TableCell>
                          <Badge className="text-xs" variant="outline">
                            Available
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                className="h-8"
                                onClick={() => setSelectedProviderId(provider.id)}
                                size="sm"
                              >
                                <Plus className="mr-1 h-3 w-3" />
                                Connect
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Connect {provider.name}</DialogTitle>
                                <DialogDescription>
                                  Connect to {provider.name} to access their models
                                </DialogDescription>
                              </DialogHeader>
                              <div className="max-h-[calc(90vh-8rem)] overflow-y-auto pr-2">
                                {selectedProviderId === provider.id && (
                                  <AddProviderForm
                                    availableProviders={[provider].filter((p) => p.enabled)}
                                    onSuccess={() => {
                                      setSelectedProviderId(null)
                                      queryClient.invalidateQueries({
                                        queryKey: ["ai-providers"],
                                      })
                                    }}
                                    preSelectedProviderId={provider.id}
                                  />
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
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

  // Performance optimization: Create Map for O(1) provider lookups
  const providersMap = useMemo(() => {
    return new Map(availableProviders.map((provider) => [provider.id, provider]))
  }, [availableProviders])

  const selectedProviderData = providersMap.get(selectedProvider as ProviderId)
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
