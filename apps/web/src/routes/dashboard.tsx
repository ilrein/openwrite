import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import TiptapEditor from "@/components/tiptap-editor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
})

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

async function fetchPrivateData() {
  const baseUrl = import.meta.env.DEV && import.meta.env.VITE_SERVER_URL ? 
    import.meta.env.VITE_SERVER_URL : 
    window.location.origin
  
  const response = await fetch(`${baseUrl}/api/private-data`, {
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch private data')
  }
  
  return response.json()
}

function RouteComponent() {
  const navigate = Route.useNavigate()
  const [content, setContent] = useState('<p>Welcome to your writing space! Start typing...</p>')

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    retry: 2,
    staleTime: 0, // Always consider stale
    gcTime: 0 // Don't cache
  })

  const privateDataQuery = useQuery({
    queryKey: ['private-data'],
    queryFn: fetchPrivateData,
    enabled: sessionQuery.data?.authenticated === true,
    retry: false
  })

  useEffect(() => {
    // Only redirect if query is not loading and definitely not authenticated
    if (!sessionQuery.isLoading && sessionQuery.data && !sessionQuery.data.authenticated) {
      navigate({
        to: "/login",
      })
    }
  }, [sessionQuery.data, sessionQuery.isLoading, navigate])

  const handleContentUpdate = (newContent: string) => {
    setContent(newContent)
    // Here you would typically save to your backend
    console.log('Content updated:', newContent)
  }

  const handleSave = () => {
    // Implement save functionality
    console.log('Saving content:', content)
    // You could show a toast notification here
  }

  if (sessionQuery.isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">Loading your writing space...</div>
      </div>
    )
  }

  if (!sessionQuery.data?.authenticated) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">Redirecting to login...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {sessionQuery.data.session?.user?.name || 'Writer'}!
        </h1>
        <p className="text-muted-foreground">
          Ready to create something amazing? Your writing space awaits.
        </p>
      </div>

      {/* Main Writing Area */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Editor - Main Column */}
        <div className="lg:col-span-3">
          <TiptapEditor
            content={content}
            onUpdate={handleContentUpdate}
            placeholder="What's on your mind today?"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Document Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Document</CardTitle>
              <CardDescription>Manage your writing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={handleSave} className="w-full">
                Save Draft
              </Button>
              <Button variant="outline" className="w-full">
                Export
              </Button>
              <Button variant="outline" className="w-full">
                Share
              </Button>
            </CardContent>
          </Card>

          {/* Writing Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Writing Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Words:</span>
                  <span className="font-medium">
                    {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Characters:</span>
                  <span className="font-medium">
                    {content.replace(/<[^>]*>/g, '').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium text-green-600">Auto-saving</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Status */}
          {privateDataQuery.data && (
            <Card>
              <CardHeader>
                <CardTitle>Connection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  {privateDataQuery.data.message}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
