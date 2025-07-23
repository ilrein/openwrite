import { Link, useNavigate } from "@tanstack/react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"

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

async function signOut() {
  const baseUrl = import.meta.env.DEV && import.meta.env.VITE_SERVER_URL ? 
    import.meta.env.VITE_SERVER_URL : 
    window.location.origin
  
  const response = await fetch(`${baseUrl}/api/auth/sign-out`, {
    method: 'POST',
    credentials: 'include'
  })
  
  return response.ok
}

export default function UserMenu() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    retry: 2,
    staleTime: 0, // Always consider stale
    refetchOnMount: true,
    refetchOnWindowFocus: true
  })

  const handleSignOut = async () => {
    try {
      await signOut()
      // Invalidate session query to refresh UI
      queryClient.invalidateQueries({ queryKey: ['session'] })
      navigate({ to: "/" })
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (sessionQuery.isLoading) {
    return <Skeleton className="h-9 w-24" />
  }

  if (!sessionQuery.data?.authenticated) {
    return (
      <Button asChild variant="outline">
        <Link to="/login">Sign In</Link>
      </Button>
    )
  }

  const session = sessionQuery.data.session

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{session.user.name || 'User'}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Button
            className="w-full"
            onClick={handleSignOut}
            variant="destructive"
          >
            Sign Out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
