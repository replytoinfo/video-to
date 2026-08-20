
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full border-[3px] border-foreground bg-background px-4 py-3 text-base font-medium ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-bold file:text-foreground file:uppercase placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 shadow-[2px_2px_0_hsl(var(--foreground))] transition-all hover:shadow-[4px_4px_0_hsl(var(--foreground))] hover:-translate-x-0.5 hover:-translate-y-0.5 focus:shadow-[4px_4px_0_hsl(var(--foreground))] focus:-translate-x-0.5 focus:-translate-y-0.5",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
