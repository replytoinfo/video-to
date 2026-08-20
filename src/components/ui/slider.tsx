
import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-4 w-full grow overflow-hidden bg-secondary border-[3px] border-foreground">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-7 w-7 border-[3px] border-foreground bg-accent shadow-[2px_2px_0_hsl(var(--foreground))] ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 hover:shadow-[4px_4px_0_hsl(var(--foreground))] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-none active:translate-x-0.5 active:translate-y-0.5 cursor-grab active:cursor-grabbing" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
