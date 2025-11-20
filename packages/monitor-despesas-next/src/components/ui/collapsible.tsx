/**
 * Collapsible component for expandable content sections
 */

import * as React from "react"
import { cn } from "@/lib/utils"

interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open = false, onOpenChange, children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("", className)} {...props}>
        {children}
      </div>
    )
  }
)
Collapsible.displayName = "Collapsible"

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ className, children, asChild = false, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<Record<string, unknown>>

      return React.cloneElement(child, {
        ...props,
        ref,
        className: cn(child.props?.className as string | undefined, className)
      })
    }

    return (
      <button
        ref={ref}
        className={cn("", className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)
CollapsibleTrigger.displayName = "CollapsibleTrigger"

interface CollapsibleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean
}

const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }