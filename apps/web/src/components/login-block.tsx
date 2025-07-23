import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PenTool, Eye, EyeOff } from "lucide-react"
import { useForm } from "@tanstack/react-form"
import { useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import z from "zod"
import { authClient } from "@/lib/auth-client"

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
      try {
        const result = mode === "signin" 
          ? await authClient.signIn.email({
              email: value.email,
              password: value.password,
            })
          : await authClient.signUp.email({
              email: value.email,
              password: value.password,
              name: value.name!,
            })

        console.log("Auth result:", result)

        // Check if authentication was successful
        if (result && (result as any)?.user) {
          toast.success(`${mode === "signin" ? "Sign in" : "Sign up"} successful`)
          
          // Function to fetch fresh session data
          const fetchSessionData = async () => {
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
          
          try {
            // Wait a moment for cookies to be set
            await new Promise(resolve => setTimeout(resolve, 200))
            
            // Fetch fresh session data and immediately update the query cache
            const sessionData = await fetchSessionData()
            
            // Only navigate if session was actually established
            if (sessionData?.authenticated) {
              // Set the session data in the query cache to immediately update all components
              queryClient.setQueryData(['session'], sessionData)
              
              // Force all components to re-render by invalidating and refetching
              await queryClient.invalidateQueries({ queryKey: ['session'] })
              await queryClient.refetchQueries({ 
                queryKey: ['session'],
                type: 'all'
              })
              
              // Navigate to dashboard
              navigate({
                to: "/dashboard",
              })
            } else {
              toast.error(`${mode === "signin" ? "Sign in" : "Sign up"} successful but session not established. Please try again.`)
            }
          } catch (error) {
            console.error("Failed to refresh session data:", error)
            toast.error(`${mode === "signin" ? "Sign in" : "Sign up"} failed. Please try again.`)
          }
        } else {
          toast.error(`${mode === "signin" ? "Sign in" : "Sign up"} failed - invalid credentials`)
        }
      } catch (error) {
        console.error(`${mode === "signin" ? "Sign in" : "Sign up"} error:`, error)
        toast.error(`${mode === "signin" ? "Sign in" : "Sign up"} failed`)
      }
    },
    validators: {
      onSubmit: ({ value }) => {
        if (mode === "signin") {
          const schema = z.object({
            email: z.string().email("Invalid email address"),
            password: z.string().min(8, "Password must be at least 8 characters"),
          })
          const result = schema.safeParse(value)
          if (!result.success) {
            return result.error.format()
          }
        } else {
          const schema = z.object({
            name: z.string().min(2, "Name must be at least 2 characters"),
            email: z.string().email("Invalid email address"),
            password: z.string().min(8, "Password must be at least 8 characters"),
          })
          const result = schema.safeParse(value)
          if (!result.success) {
            return result.error.format()
          }
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
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-3 mb-6">
              <PenTool className="h-8 w-8" />
              <span className="text-2xl font-bold">OpenWrite</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create an account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "signin" 
                ? "Enter your credentials to sign in to your account" 
                : "Enter your information to create your account"
              }
            </p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">
                {mode === "signin" ? "Sign in" : "Sign up"}
              </CardTitle>
              <CardDescription>
                {mode === "signin" 
                  ? "Enter your email and password below" 
                  : "Create your account to get started"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  void form.handleSubmit()
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
                            placeholder="John Doe"
                            value={field.state.value || ""}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                          {field.state.meta.errors.map((error, index) => (
                            <p className="text-sm text-destructive" key={index}>
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
                          type="email"
                          placeholder="you@example.com"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        {field.state.meta.errors.map((error, index) => (
                          <p className="text-sm text-destructive" key={index}>
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
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {field.state.meta.errors.map((error, index) => (
                          <p className="text-sm text-destructive" key={index}>
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
                      type="submit"
                      className="w-full"
                      disabled={!state.canSubmit || state.isSubmitting}
                    >
                      {state.isSubmitting 
                        ? "Processing..." 
                        : mode === "signin" 
                          ? "Sign in" 
                          : "Create account"
                      }
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
                  variant="link"
                  className="p-0 h-auto font-semibold"
                  onClick={() => onModeChange("signup")}
                >
                  Sign up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-semibold"
                  onClick={() => onModeChange("signin")}
                >
                  Sign in
                </Button>
              </>
            )}
          </div>

          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <Link to="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}