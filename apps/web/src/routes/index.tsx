import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Github, Star, GitFork, Heart, Code2, Users } from "lucide-react"

export const Route = createFileRoute("/")({
  component: HomeComponent,
})

const TITLE_TEXT = `
  ██████╗ ██████╗ ███████╗███╗   ██╗
 ██╔═══██╗██╔══██╗██╔════╝████╗  ██║
 ██║   ██║██████╔╝█████╗  ██╔██╗ ██║
 ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║
 ╚██████╔╝██║     ███████╗██║ ╚████║
  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝

 ██╗    ██╗██████╗ ██╗████████╗███████╗
 ██║    ██║██╔══██╗██║╚══██╔══╝██╔════╝
 ██║ █╗ ██║██████╔╝██║   ██║   █████╗  
 ██║███╗██║██╔══██╗██║   ██║   ██╔══╝  
 ╚███╔███╔╝██║  ██║██║   ██║   ███████╗
  ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝
 `

async function checkApiHealth() {
  // In development, use VITE_SERVER_URL. In production, use same origin
  const baseUrl = import.meta.env.DEV && import.meta.env.VITE_SERVER_URL ? 
    import.meta.env.VITE_SERVER_URL : 
    window.location.origin
  const response = await fetch(`${baseUrl}/api/health`)
  return response.ok
}

async function fetchSession() {
  const baseUrl = import.meta.env.DEV && import.meta.env.VITE_SERVER_URL ? 
    import.meta.env.VITE_SERVER_URL : 
    window.location.origin
  
  const response = await fetch(`${baseUrl}/api/session`, {
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch session')
  }
  
  return response.json()
}

function HomeComponent() {
  const navigate = Route.useNavigate()
  
  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    retry: false
  })
  
  const healthCheck = useQuery({
    queryKey: ['api-health'],
    queryFn: checkApiHealth,
    retry: 1
  })

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (sessionQuery.data?.authenticated) {
      navigate({
        to: "/dashboard",
      })
    }
  }, [sessionQuery.data, navigate])

  return (
    <div className="container mx-auto max-w-4xl px-4 py-2">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <pre className="overflow-x-auto font-mono text-sm mb-6">{TITLE_TEXT}</pre>
        <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
          A modern, AI-powered writing platform built with the latest web technologies. 
          Create, edit, and collaborate with intelligent assistance.
        </p>
        <div className="flex gap-4 justify-center mb-6">
          <Button asChild size="lg">
            <Link to="/dashboard">Get Started</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          <Badge variant="secondary">TypeScript</Badge>
          <Badge variant="secondary">React</Badge>
          <Badge variant="secondary">Hono</Badge>
          <Badge variant="secondary">TanStack</Badge>
          <Badge variant="secondary">Cloudflare</Badge>
          <Badge variant="secondary">AI-Powered</Badge>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Features Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>✍️ Rich Text Editor</CardTitle>
            <CardDescription>
              Powered by Tiptap with markdown support and AI assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Write with a beautiful, extensible editor that supports real-time collaboration and intelligent suggestions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🚀 Modern Stack</CardTitle>
            <CardDescription>
              Built with React 19, TypeScript, and Cloudflare Workers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Lightning-fast performance with edge computing and type-safe development experience.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔐 Secure Auth</CardTitle>
            <CardDescription>
              Better Auth integration with session management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Secure authentication with email/password and modern session handling.
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Open Source Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Heart className="h-6 w-6 text-red-500" />
          <h2 className="text-2xl font-bold">100% Open Source</h2>
          <Heart className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          OpenWrite is completely open source and built in the open. 
          Contribute, learn, and help make writing better for everyone.
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <Button variant="outline" asChild className="gap-2">
            <a href="https://github.com/ilrein/openwrite" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
              View Source
            </a>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <a href="https://github.com/ilrein/openwrite/stargazers" target="_blank" rel="noopener noreferrer">
              <Star className="h-4 w-4" />
              Star on GitHub
            </a>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <a href="https://github.com/ilrein/openwrite/fork" target="_blank" rel="noopener noreferrer">
              <GitFork className="h-4 w-4" />
              Fork Project
            </a>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 max-w-3xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center p-6">
              <Code2 className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">AGPL-3.0 Licensed</h3>
              <p className="text-sm text-muted-foreground text-center">
                Strong copyleft license ensuring freedom and transparency
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex flex-col items-center p-6">
              <Users className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Community Driven</h3>
              <p className="text-sm text-muted-foreground text-center">
                Built by developers, for developers and writers
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex flex-col items-center p-6">
              <Github className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Always Transparent</h3>
              <p className="text-sm text-muted-foreground text-center">
                All development happens in the open on GitHub
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="my-8" />

      {/* System Status */}
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-sm">
              API: {healthCheck.isLoading
                ? "Checking..."
                : healthCheck.data
                  ? "Connected"
                  : "Disconnected"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
