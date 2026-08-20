import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-7 w-14 shrink-0 cursor-pointer items-center border-[3px] border-foreground transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-secondary shadow-[2px_2px_0_hsl(var(--foreground))] hover:shadow-[3px_3px_0_hsl(var(--foreground))] hover:-translate-x-0.5 hover:-translate-y-0.5",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 bg-foreground ring-0 transition-transform data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-0.5"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
