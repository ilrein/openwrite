import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

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

  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    retry: false
  })

  const privateDataQuery = useQuery({
    queryKey: ['private-data'],
    queryFn: fetchPrivateData,
    enabled: sessionQuery.data?.authenticated === true,
    retry: false
  })

  useEffect(() => {
    if (sessionQuery.data && !sessionQuery.data.authenticated) {
      navigate({
        to: "/login",
      })
    }
  }, [sessionQuery.data, navigate])

  if (sessionQuery.isLoading) {
    return <div>Loading...</div>
  }

  if (!sessionQuery.data?.authenticated) {
    return <div>Redirecting to login...</div>
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {sessionQuery.data.session?.user?.name || 'User'}</p>
      <p>privateData: {privateDataQuery.data?.message || 'Loading...'}</p>
      {privateDataQuery.error && (
        <p>Error loading private data: {privateDataQuery.error.message}</p>
      )}
    </div>
  )
}
