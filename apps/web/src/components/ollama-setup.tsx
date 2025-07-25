import { AlertCircle, CheckCircle, Copy, ExternalLink } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

type ConnectionMethod = "ngrok" | "cloudflare" | "manual"

interface OllamaSetupProps {
  onConnect: (config: { apiUrl: string; connectionMethod: ConnectionMethod }) => void
  loading?: boolean
}

export function OllamaSetup({ onConnect, loading }: OllamaSetupProps) {
  const [connectionMethod, setConnectionMethod] = useState<ConnectionMethod>("ngrok")
  const [apiUrl, setApiUrl] = useState("")
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const testConnection = async () => {
    if (!apiUrl) {
      return
    }

    setTestingConnection(true)
    setConnectionStatus("idle")

    try {
      // Test the connection by hitting the /api/tags endpoint
      const testUrl = apiUrl.endsWith("/") ? `${apiUrl}api/tags` : `${apiUrl}/api/tags`

      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setConnectionStatus("success")
        toast.success("Connection successful!")
      } else {
        setConnectionStatus("error")
        toast.error(`Connection failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      setConnectionStatus("error")
      toast.error(`Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setTestingConnection(false)
    }
  }

  const handleConnect = () => {
    if (!apiUrl) {
      return
    }
    onConnect({ apiUrl, connectionMethod })
  }

  const setupGuides = {
    ngrok: {
      title: "Ngrok Setup (Recommended)",
      description: "Quick setup with temporary or persistent URLs",
      steps: [
        {
          title: "Install ngrok",
          content: "Download and install ngrok from https://ngrok.com/",
        },
        {
          title: "Start Ollama",
          content: "Make sure Ollama is running locally on port 11434",
        },
        {
          title: "Create tunnel",
          content: 'ngrok http 11434 --host-header="localhost:11434"',
          copyable: true,
        },
        {
          title: "Copy URL",
          content: "Copy the HTTPS forwarding URL (e.g., https://abc123.ngrok.app)",
        },
      ],
    },
    cloudflare: {
      title: "Cloudflare Tunnel Setup",
      description: "Free persistent tunnels with better integration",
      steps: [
        {
          title: "Install cloudflared",
          content:
            "Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/",
        },
        {
          title: "Start Ollama",
          content: "Make sure Ollama is running locally on port 11434",
        },
        {
          title: "Create tunnel",
          content:
            'cloudflared tunnel --url http://localhost:11434 --http-host-header="localhost:11434"',
          copyable: true,
        },
        {
          title: "Copy URL",
          content: "Copy the HTTPS URL provided by cloudflared",
        },
      ],
    },
    manual: {
      title: "Manual Configuration",
      description: "Enter a custom Ollama API URL",
      steps: [
        {
          title: "Custom Setup",
          content:
            "Enter your Ollama API URL directly (e.g., if running on a server or custom configuration)",
        },
      ],
    },
  }

  const currentGuide = setupGuides[connectionMethod]

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="font-medium text-base">Connection Method</Label>
          <p className="text-muted-foreground text-sm">
            Choose how to connect to your local Ollama instance
          </p>
          <Select
            onValueChange={(value) => setConnectionMethod(value as ConnectionMethod)}
            value={connectionMethod}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select connection method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ngrok">
                <div className="flex items-center gap-2">
                  Ngrok
                  <Badge className="text-xs" variant="secondary">
                    Recommended
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="cloudflare">Cloudflare Tunnel</SelectItem>
              <SelectItem value="manual">Manual Configuration</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {connectionMethod !== "manual" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {currentGuide.title}
              <Badge className="text-xs" variant="outline">
                Setup Guide
              </Badge>
            </CardTitle>
            <p className="text-muted-foreground text-sm">{currentGuide.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentGuide.steps.map((step, index) => (
              <div className="space-y-2" key={`${step.title}-${index}`}>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-xs">
                    {index + 1}
                  </div>
                  <h4 className="font-medium">{step.title}</h4>
                </div>
                <div className="ml-8 space-y-2">
                  <p className="text-muted-foreground text-sm">{step.content}</p>
                  {step.copyable && (
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded bg-muted px-2 py-1 text-sm">
                        {step.content}
                      </code>
                      <Button
                        onClick={() => copyToClipboard(step.content)}
                        size="sm"
                        variant="ghost"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="apiUrl">
            {connectionMethod === "manual" ? "Ollama API URL" : "Tunnel URL"}
          </Label>
          <div className="flex gap-2">
            <Input
              id="apiUrl"
              onChange={(e) => {
                setApiUrl(e.target.value)
                setConnectionStatus("idle")
              }}
              placeholder={
                connectionMethod === "manual"
                  ? "http://your-server:11434"
                  : "https://abc123.ngrok.app"
              }
              value={apiUrl}
            />
            <Button
              disabled={!apiUrl || testingConnection}
              onClick={testConnection}
              type="button"
              variant="outline"
            >
              {testingConnection ? "Testing..." : "Test"}
            </Button>
          </div>
          {connectionStatus === "success" && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              Connection successful
            </div>
          )}
          {connectionStatus === "error" && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              Connection failed
            </div>
          )}
          <p className="text-muted-foreground text-sm">
            Make sure your tunnel is running and paste the HTTPS URL here
          </p>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            disabled={!apiUrl || loading || connectionStatus === "error"}
            onClick={handleConnect}
          >
            {loading ? "Connecting..." : "Connect Ollama"}
          </Button>
          <Button
            onClick={() => window.open("https://ollama.com/download", "_blank")}
            type="button"
            variant="outline"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Download Ollama
          </Button>
        </div>
      </div>
    </div>
  )
}
