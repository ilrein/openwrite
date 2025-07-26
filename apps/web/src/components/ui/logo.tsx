import { Link } from "@tanstack/react-router"
import { PenTool } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  to?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function Logo({ className, to = "/", size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5 sm:h-6 sm:w-6",
    lg: "h-6 w-6 sm:h-8 sm:w-8",
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base sm:text-lg",
    lg: "text-lg sm:text-xl",
  }

  const content = (
    <>
      <PenTool className={cn(sizeClasses[size])} />
      {showText && <span className={cn("font-bold", textSizeClasses[size])}>OpenWrite</span>}
    </>
  )

  if (to) {
    return (
      <Link
        className={cn("flex items-center space-x-2 transition-opacity hover:opacity-80", className)}
        to={to}
      >
        {content}
      </Link>
    )
  }

  return <div className={cn("flex items-center space-x-2", className)}>{content}</div>
}
