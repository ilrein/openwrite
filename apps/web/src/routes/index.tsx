import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Code2, GitFork, Github, Heart, Star, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

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

// Typewriter animation component
function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (!isComplete && currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)

        // Mark as complete when finished
        if (currentIndex + 1 >= text.length) {
          setIsComplete(true)
          setShowCursor(false) // Hide cursor when done
        }
      }, 2.5) // ULTRA FAST typing speed!

      return () => clearTimeout(timer)
    }
  }, [currentIndex, text, isComplete])

  // Blinking cursor effect (only while typing)
  useEffect(() => {
    if (!isComplete) {
      const cursorTimer = setInterval(() => {
        setShowCursor((prev) => !prev)
      }, 500)

      return () => clearInterval(cursorTimer)
    }
  }, [isComplete])

  return (
    <div className="typewriter-container">
      <style>{`
        .typewriter-container {
          font-family: monospace;
          white-space: pre;
          overflow-x: auto;
          position: relative;
        }
        
        .typewriter-cursor {
          display: inline-block;
          background-color: currentColor;
          width: 2px;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
      <span>{displayedText}</span>
      {currentIndex <= text.length && (
        <span className="typewriter-cursor" style={{ opacity: showCursor ? 1 : 0 }}>
          |
        </span>
      )}
    </div>
  )
}

async function checkApiHealth() {
  // In development, use VITE_SERVER_URL. In production, use same origin
  const baseUrl =
    import.meta.env.DEV && import.meta.env.VITE_SERVER_URL
      ? import.meta.env.VITE_SERVER_URL
      : window.location.origin
  const response = await fetch(`${baseUrl}/api/health`)
  return response.ok
}

async function fetchSession() {
  const baseUrl =
    import.meta.env.DEV && import.meta.env.VITE_SERVER_URL
      ? import.meta.env.VITE_SERVER_URL
      : window.location.origin

  const response = await fetch(`${baseUrl}/api/session`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch session")
  }

  return response.json()
}

function HomeComponent() {
  const navigate = Route.useNavigate()

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    retry: false,
  })

  const healthCheck = useQuery({
    queryKey: ["api-health"],
    queryFn: checkApiHealth,
    retry: 1,
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
      <div className="mb-8 text-center">
        <div className="mb-6 text-sm">
          <TypewriterText text={TITLE_TEXT} />
        </div>
        <p className="mx-auto mb-6 max-w-2xl text-lg text-muted-foreground">
          A modern, AI-powered writing platform built with the latest web technologies. Create,
          edit, and collaborate with intelligent assistance.
        </p>
        <div className="mb-6 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/register">Get Started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
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
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>✍️ Rich Text Editor</CardTitle>
            <CardDescription>
              Powered by Tiptap with markdown support and AI assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Write with a beautiful, extensible editor that supports real-time collaboration and
              intelligent suggestions.
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
            <p className="text-muted-foreground text-sm">
              Lightning-fast performance with edge computing and type-safe development experience.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>🔐 Secure Auth</CardTitle>
            <CardDescription>Better Auth integration with session management</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Secure authentication with email/password and modern session handling.
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* Open Source Section */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 text-red-500" />
          <h2 className="font-bold text-2xl">100% Open Source</h2>
          <Heart className="h-6 w-6 text-red-500" />
        </div>
        <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
          OpenWrite is completely open source and built in the open. Contribute, learn, and help
          make writing better for everyone.
        </p>

        <div className="mb-6 flex flex-wrap justify-center gap-4">
          <Button asChild className="gap-2" variant="outline">
            <a href="https://github.com/ilrein/openwrite" rel="noopener noreferrer" target="_blank">
              <Github className="h-4 w-4" />
              View Source
            </a>
          </Button>
          <Button asChild className="gap-2" variant="outline">
            <a
              href="https://github.com/ilrein/openwrite/stargazers"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Star className="h-4 w-4" />
              Star on GitHub
            </a>
          </Button>
          <Button asChild className="gap-2" variant="outline">
            <a
              href="https://github.com/ilrein/openwrite/fork"
              rel="noopener noreferrer"
              target="_blank"
            >
              <GitFork className="h-4 w-4" />
              Fork Project
            </a>
          </Button>
        </div>

        <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex flex-col items-center p-6">
              <Code2 className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-semibold">AGPL-3.0 Licensed</h3>
              <p className="text-center text-muted-foreground text-sm">
                Strong copyleft license ensuring freedom and transparency
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center p-6">
              <Users className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-semibold">Community Driven</h3>
              <p className="text-center text-muted-foreground text-sm">
                Built by developers, for developers and writers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center p-6">
              <Github className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-semibold">Always Transparent</h3>
              <p className="text-center text-muted-foreground text-sm">
                All development happens in the open on GitHub
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="my-8" />

      {/* System Status */}
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-sm">
              API: {(() => {
                if (healthCheck.isLoading) {
                  return "Checking..."
                }
                return healthCheck.data ? "Connected" : "Disconnected"
              })()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
