import * as React from "react"
import { cn } from "@/lib/tiptap-utils"
import "@/components/tiptap-ui-primitive/card/card.scss"

const Card = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return <div className={cn("tiptap-card", className)} ref={ref} {...props} />
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return <div className={cn("tiptap-card-header", className)} ref={ref} {...props} />
  }
)
CardHeader.displayName = "CardHeader"

const CardBody = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return <div className={cn("tiptap-card-body", className)} ref={ref} {...props} />
  }
)
CardBody.displayName = "CardBody"

const CardItemGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    orientation?: "horizontal" | "vertical"
  }
>(({ className, orientation = "vertical", ...props }, ref) => {
  return (
    <div
      className={cn("tiptap-card-item-group", className)}
      data-orientation={orientation}
      ref={ref}
      {...props}
    />
  )
})
CardItemGroup.displayName = "CardItemGroup"

const CardGroupLabel = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return <div className={cn("tiptap-card-group-label", className)} ref={ref} {...props} />
  }
)
CardGroupLabel.displayName = "CardGroupLabel"

const CardFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return <div className={cn("tiptap-card-footer", className)} ref={ref} {...props} />
  }
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardBody, CardItemGroup, CardGroupLabel }
