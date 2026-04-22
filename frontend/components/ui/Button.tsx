import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "link" | "glass"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    
    // Premium Design Variants
    const variants = {
      default: "bg-primary text-background font-medium hover:bg-primaryHover hover:shadow-glow transition-all duration-300",
      outline: "border border-primary text-primary hover:bg-primary hover:text-background transition-all duration-300",
      ghost: "hover:bg-surfaceLayer text-textMuted hover:text-white transition-all duration-300",
      link: "text-primary underline-offset-4 hover:underline",
      glass: "bg-glass-gradient backdrop-blur-md border border-border text-white hover:bg-white/10 hover:shadow-glass transition-all duration-300"
    }

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-12 rounded-md px-8 text-lg",
      icon: "h-10 w-10",
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm ring-offset-background disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
