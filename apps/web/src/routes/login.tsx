import { createFileRoute } from "@tanstack/react-router"
import LoginBlock from "@/components/login-block"

export const Route = createFileRoute("/login")({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()

  return (
    <LoginBlock
      mode="signin"
      onModeChange={() => {
        // Navigate to register page when switching to signup
        navigate({ to: "/register" })
      }}
    />
  )
}
