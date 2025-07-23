import { useForm } from "@tanstack/react-form"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import z from "zod"
import { authClient } from "@/lib/auth-client"
import Loader from "./loader"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

export default function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const navigate = useNavigate({
    from: "/",
  })
  const queryClient = useQueryClient()
  const { isPending } = authClient.useSession()

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await authClient.signIn.email(
          {
            email: value.email,
            password: value.password,
          },
          {
            onError: (error) => {
              toast.error(error.error.message)
            },
          }
        )

        // Check if sign-in was successful - look for either user data or successful response
        const isSuccess =
          result &&
          ((result as any)?.user ||
            (result as any)?.data?.user ||
            // If no errors and we got a response, consider it successful
            (result && typeof result === "object" && !(result as any)?.error))

        if (isSuccess) {
          toast.success("Sign in successful")

          // Function to fetch fresh session data
          const fetchSessionData = async () => {
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

          try {
            // Wait a moment for cookies to be set
            await new Promise((resolve) => setTimeout(resolve, 200))

            // Fetch fresh session data and immediately update the query cache
            const sessionData = await fetchSessionData()

            // Only navigate if session was actually established
            if (sessionData?.authenticated) {
              // Set the session data in the query cache to immediately update all components
              queryClient.setQueryData(["session"], sessionData)

              // Force all components to re-render by invalidating and refetching
              await queryClient.invalidateQueries({ queryKey: ["session"] })
              await queryClient.refetchQueries({
                queryKey: ["session"],
                type: "all",
              })

              // Wait a moment for all components to re-render with new data
              await new Promise((resolve) => setTimeout(resolve, 100))

              // Navigate to dashboard
              navigate({
                to: "/dashboard",
              })
            } else {
              toast.error("Sign in successful but session not established. Please try again.")
            }
          } catch (_error) {
            toast.error("Sign in failed. Please try again.")
          }
        } else {
          toast.error("Sign in failed - invalid credentials")
        }
      } catch (_error) {
        toast.error("Sign in failed")
      }
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  })

  if (isPending) {
    return <Loader />
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <h1 className="mb-6 text-center font-bold text-3xl">Welcome Back</h1>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <div>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="email"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-red-500" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Password</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="password"
                  value={field.state.value}
                />
                {field.state.meta.errors.map((error) => (
                  <p className="text-red-500" key={error?.message}>
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe>
          {(state) => (
            <Button
              className="w-full"
              disabled={!state.canSubmit || state.isSubmitting}
              type="submit"
            >
              {state.isSubmitting ? "Submitting..." : "Sign In"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 text-center">
        <Button
          className="text-indigo-600 hover:text-indigo-800"
          onClick={onSwitchToSignUp}
          variant="link"
        >
          Need an account? Sign Up
        </Button>
      </div>
    </div>
  )
}
