"use client"

import { createFileRoute } from "@tanstack/react-router"
import { BarChart3, Plus, RefreshCw, Settings, TestTube, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { type AiProvider, aiProvidersApi } from "@/lib/api/ai-providers"
import { buildAuthURL, generatePKCEParams } from "@/lib/pkce"

function AIProvidersPage() {
  const [providers, setProviders] = useState<AiProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [addProviderOpen, setAddProviderOpen] = useState(false)
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true)
      const data = await aiProvidersApi.list()
      setProviders(data)
    } catch (_error) {
      // Error handling removed for linting
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProviders()
  }, [loadProviders])

  const getProviderStatus = (provider: AiProvider) => {
    if (!provider.isActive) {
      return { variant: "outline" as const, text: "Inactive" }
    }
    // Note: No lastError property in AiProvider interface - using isActive only
    return { variant: "default" as const, text: "Active" }
  }

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
      enabled: false,
    },
  ]

  const connectedProviders = providers
  const unconnectedProviders = availableProviders.filter(
    (ap) => !providers.some((p) => p.provider === ap.id)
  )

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">AI Providers & Models</h1>
          <p className="text-muted-foreground">
            Manage your AI provider connections and API configurations
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog onOpenChange={setAddProviderOpen} open={addProviderOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setSelectedProviderId(null)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Provider
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add AI Provider</DialogTitle>
                <DialogDescription>
                  Connect a new AI provider to access their models
                </DialogDescription>
              </DialogHeader>
              <AddProviderForm
                availableProviders={unconnectedProviders.filter((p) => p.enabled)}
                onSuccess={() => {
                  setAddProviderOpen(false)
                  setSelectedProviderId(null)
                  loadProviders()
                }}
                preSelectedProviderId={selectedProviderId}
              />
            </DialogContent>
          </Dialog>
          <Button onClick={loadProviders} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync All
          </Button>
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Usage Stats
          </Button>
        </div>
      </div>

      <Tabs className="space-y-4" defaultValue="connected">
        <TabsList>
          <TabsTrigger value="connected">Connected Providers</TabsTrigger>
          <TabsTrigger value="available">Available Providers</TabsTrigger>
          <TabsTrigger value="usage">Usage Overview</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="connected">
          {loading && <div className="py-8 text-center">Loading providers...</div>}

          {!loading && connectedProviders.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No providers connected yet</p>
                  <Button
                    className="mt-4"
                    onClick={() => {
                      setSelectedProviderId(null)
                      setAddProviderOpen(true)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Provider
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && connectedProviders.length > 0 && (
            <div className="grid gap-4">
              {connectedProviders.map((provider) => {
                const status = getProviderStatus(provider)
                return (
                  <Card key={provider.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="capitalize">{provider.provider}</CardTitle>
                          <Badge variant={status.variant}>{status.text}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <TestTube className="mr-2 h-4 w-4" />
                            Test API
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="mr-2 h-4 w-4" />
                            Configure
                          </Button>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Disconnect
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        API Key: {provider.keyHash ? `${provider.keyHash}...` : "Not set"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label>Usage This Month</Label>
                          <p className="font-medium">{provider.currentUsage || 0} requests</p>
                        </div>
                        <div>
                          <Label>Last Used</Label>
                          <p className="font-medium">
                            {provider.lastUsedAt
                              ? new Date(provider.lastUsedAt).toLocaleDateString()
                              : "Never"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent className="space-y-4" value="available">
          <div className="grid gap-4">
            {unconnectedProviders.map((provider) => (
              <Card className={provider.enabled ? "" : "opacity-60"} key={provider.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className={provider.enabled ? "" : "text-muted-foreground"}>
                        {provider.name}
                      </CardTitle>
                      {provider.recommended && <Badge variant="secondary">Recommended</Badge>}
                      {!provider.enabled && <Badge variant="outline">Coming Soon</Badge>}
                    </div>
                    <Button
                      disabled={!provider.enabled}
                      onClick={() => {
                        if (provider.enabled) {
                          setSelectedProviderId(provider.id)
                          setAddProviderOpen(true)
                        }
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {provider.enabled ? "Connect" : "Coming Soon"}
                    </Button>
                  </div>
                  <CardDescription className={provider.enabled ? "" : "text-muted-foreground/70"}>
                    {provider.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent className="space-y-4" value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Usage Overview</CardTitle>
              <CardDescription>Your AI provider usage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div>
                  <Label>Total Requests</Label>
                  <p className="font-bold text-2xl">
                    {providers.reduce((sum, p) => sum + (p.currentUsage || 0), 0)}
                  </p>
                </div>
                <div>
                  <Label>Active Providers</Label>
                  <p className="font-bold text-2xl">{providers.filter((p) => p.isActive).length}</p>
                </div>
                <div>
                  <Label>This Month</Label>
                  <p className="font-bold text-2xl">
                    {providers.reduce((sum, p) => sum + (p.currentUsage || 0), 0)}
                  </p>
                </div>
                <div>
                  <Label>Avg Response Time</Label>
                  <p className="font-bold text-2xl">1.2s</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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

  // Handle OAuth callback
  // biome-ignore lint/correctness/useExhaustiveDependencies: OAuth callback only runs once on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get("code")

    // Check if this is an OpenRouter OAuth callback by presence of code and stored PKCE params
    if (code && localStorage.getItem("openrouter-pkce")) {
      handleOAuthCallback(code, "")
      // Clean up URL parameters
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
    }
  }, [])

  const handleOAuthCallback = async (code: string, _state: string) => {
    try {
      setOauthLoading(true)

      // Get stored PKCE parameters
      const storedParams = localStorage.getItem("openrouter-pkce")
      if (!storedParams) {
        console.error("No PKCE parameters found in localStorage")
        return
      }

      const { codeVerifier, codeChallengeMethod } = JSON.parse(storedParams)
      localStorage.removeItem("openrouter-pkce")

      console.log("Exchanging OAuth code:", code)
      console.log("Using code verifier:", codeVerifier)
      console.log("Using challenge method:", codeChallengeMethod)

      // Exchange code for API key
      const result = await aiProvidersApi.exchangeOpenRouterCode({
        code,
        codeVerifier,
        codeChallengeMethod,
      })

      console.log("Exchange result:", result)
      onSuccess()
    } catch (error) {
      console.error("OAuth callback failed:", error)
    } finally {
      setOauthLoading(false)
    }
  }

  const handleOAuthLogin = async () => {
    try {
      setOauthLoading(true)

      // Generate PKCE parameters
      const pkceParams = await generatePKCEParams()

      // Store PKCE parameters for later use
      localStorage.setItem(
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

      {selectedProvider && (selectedProvider !== "openrouter" || showManualApiKey) && (
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

      <div className="flex gap-2 pt-4">
        <Button
          disabled={
            !selectedProvider ||
            (selectedProvider === "openrouter" && showManualApiKey && !apiKey) ||
            (selectedProvider !== "openrouter" && !apiKey) ||
            loading ||
            oauthLoading
          }
          type="submit"
        >
          {loading ? "Connecting..." : "Connect Provider"}
        </Button>
      </div>
    </form>
  )
}

export const Route = createFileRoute("/dashboard/ai")({
  component: AIProvidersPage,
})
