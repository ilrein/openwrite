import { useForm } from "@tanstack/react-form"
import { useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient, fetchSessionData } from "@/lib/auth-client"

interface LoginBlockProps {
  mode: "signin" | "signup"
  onModeChange: (mode: "signin" | "signup") => void
}

export default function LoginBlock({ mode, onModeChange }: LoginBlockProps) {
  const navigate = useNavigate({ from: "/login" })
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)
  const { isPending } = authClient.useSession()

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: mode === "signup" ? "" : undefined,
    },
    onSubmit: async ({ value }) => {
      const actionType = mode === "signin" ? "Sign in" : "Sign up"
      
      // Attempt authentication with Better Auth (ignoring any thrown errors)
      let authAttempted = false
      try {
        if (mode === "signin") {
          await authClient.signIn.email({
            email: value.email,
            password: value.password,
          })
        } else {
          await authClient.signUp.email({
            email: value.email,
            password: value.password,
            name: value.name ?? "",
          })
        }
        authAttempted = true
      } catch {
        authAttempted = true
        // Continue execution - we'll check session status directly
      }

      if (!authAttempted) {
        toast.error(`${actionType} failed`)
        return
      }

      try {
        // Wait a moment for cookies to be set
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Check if authentication actually succeeded by fetching session
        const sessionData = await fetchSessionData()

        if (sessionData?.authenticated && sessionData?.session?.user) {
          // Authentication was successful
          toast.success(`${actionType} successful`)

          // Set the session data in the query cache to immediately update all components
          queryClient.setQueryData(["session"], sessionData)

          // Force all components to re-render by invalidating and refetching
          await queryClient.invalidateQueries({ queryKey: ["session"] })
          await queryClient.refetchQueries({
            queryKey: ["session"],
            type: "all",
          })

          // Navigate to dashboard
          navigate({
            to: "/dashboard",
          })
        } else {
          // Authentication failed
          toast.error(`${actionType} failed - please check your credentials`)
        }
      } catch {
        toast.error(`${actionType} failed - please try again`)
      }
    },
    validators: {
      onSubmit: ({ value }) => {
        const baseSchema = {
          email: z.string().email("Invalid email address"),
          password: z.string().min(8, "Password must be at least 8 characters"),
        }
        
        const schema = mode === "signin" 
          ? z.object(baseSchema)
          : z.object({
              ...baseSchema,
              name: z.string().min(2, "Name must be at least 2 characters"),
            })
            
        const result = schema.safeParse(value)
        if (!result.success) {
          return result.error.flatten()
        }
      },
    },
  })

  if (isPending) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <h1 className="font-semibold text-xl tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === "signin"
                ? "Enter your credentials to sign in to your account"
                : "Enter your information to create your account"}
            </p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">{mode === "signin" ? "Sign in" : "Sign up"}</CardTitle>
              <CardDescription>
                {mode === "signin"
                  ? "Enter your email and password below"
                  : "Create your account to get started"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  form.handleSubmit()
                }}
              >
                {mode === "signup" && (
                  <div className="space-y-2">
                    <form.Field name="name">
                      {(field) => (
                        <>
                          <Label htmlFor={field.name}>Name</Label>
                          <Input
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="John Doe"
                            value={field.state.value || ""}
                          />
                          {field.state.meta.errors.map((error) => (
                            <p className="text-destructive text-sm" key={String(error)}>
                              {String(error)}
                            </p>
                          ))}
                        </>
                      )}
                    </form.Field>
                  </div>
                )}

                <div className="space-y-2">
                  <form.Field name="email">
                    {(field) => (
                      <>
                        <Label htmlFor={field.name}>Email</Label>
                        <Input
                          id={field.name}
                          name={field.name}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="you@example.com"
                          type="email"
                          value={field.state.value}
                        />
                        {field.state.meta.errors.map((error) => (
                          <p className="text-destructive text-sm" key={String(error)}>
                            {String(error)}
                          </p>
                        ))}
                      </>
                    )}
                  </form.Field>
                </div>

                <div className="space-y-2">
                  <form.Field name="password">
                    {(field) => (
                      <>
                        <Label htmlFor={field.name}>Password</Label>
                        <div className="relative">
                          <Input
                            id={field.name}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Enter your password"
                            type={showPassword ? "text" : "password"}
                            value={field.state.value}
                          />
                          <Button
                            className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {field.state.meta.errors.map((error) => (
                          <p className="text-destructive text-sm" key={String(error)}>
                            {String(error)}
                          </p>
                        ))}
                      </>
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
{(() => {
                        if (state.isSubmitting) {
                          return "Processing..."
                        }
                        return mode === "signin" ? "Sign in" : "Create account"
                      })()}
                    </Button>
                  )}
                </form.Subscribe>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm">
            {mode === "signin" ? (
              <>
                Don't have an account?{" "}
                <Button
                  className="h-auto p-0 font-semibold"
                  onClick={() => onModeChange("signup")}
                  variant="link"
                >
                  Sign up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Button
                  className="h-auto p-0 font-semibold"
                  onClick={() => onModeChange("signin")}
                  variant="link"
                >
                  Sign in
                </Button>
              </>
            )}
          </div>

          <p className="px-8 text-center text-muted-foreground text-sm">
            By clicking continue, you agree to our{" "}
            <Link className="underline underline-offset-4 hover:text-primary" to="/terms">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link className="underline underline-offset-4 hover:text-primary" to="/privacy">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
