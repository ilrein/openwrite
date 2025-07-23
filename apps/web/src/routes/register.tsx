import { createFileRoute } from "@tanstack/react-router"
import LoginBlock from "@/components/login-block"

export const Route = createFileRoute("/register")({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()

  return (
    <LoginBlock 
      mode="signup" 
      onModeChange={() => {
        // Navigate to login page when switching to signin
        navigate({ to: "/login" })
      }} 
    />
  )
}