import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-6 w-full overflow-hidden bg-secondary border-[3px] border-foreground shadow-[3px_3px_0_hsl(var(--foreground))]",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all duration-300 ease-out brutal-stripes"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
    {/* Progress percentage text overlay */}
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="text-xs font-bold uppercase tracking-wide text-foreground mix-blend-difference">
        {Math.round(value || 0)}%
      </span>
    </div>
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
