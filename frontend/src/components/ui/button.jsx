import * as React from "react"
import { cn } from "../../lib/utils"

const Button = React.forwardRef(({ className, variant = "default", size = "default", disabled, ...props }, ref) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-slate-900 text-slate-50 hover:bg-slate-800": variant === "default",
          "bg-red-600 text-white hover:bg-red-700": variant === "destructive",
          "border border-slate-200 bg-white hover:bg-slate-100": variant === "outline",
          "bg-transparent hover:bg-slate-100": variant === "ghost",
        },
        {
          "h-10 px-4 py-2": size === "default",
          "h-9 rounded-md px-3": size === "sm",
          "h-11 rounded-md px-8": size === "lg",
        },
        className
      )}
      ref={ref}
      disabled={disabled}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button }
