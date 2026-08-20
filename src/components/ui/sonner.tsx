import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-[3px] group-[.toaster]:border-foreground group-[.toaster]:shadow-[4px_4px_0_hsl(var(--foreground))] group-[.toaster]:rounded-none group-[.toaster]:font-bold group-[.toaster]:uppercase group-[.toaster]:tracking-wide",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:font-medium group-[.toast]:normal-case",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:border-[2px] group-[.toast]:border-foreground group-[.toast]:shadow-[2px_2px_0_hsl(var(--foreground))] group-[.toast]:font-bold group-[.toast]:uppercase",
          cancelButton:
            "group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground group-[.toast]:border-[2px] group-[.toast]:border-foreground group-[.toast]:font-bold group-[.toast]:uppercase",
          success:
            "group-[.toaster]:bg-[hsl(90,80%,55%)] group-[.toaster]:text-black",
          error:
            "group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground",
          warning:
            "group-[.toaster]:bg-[hsl(25,100%,55%)] group-[.toaster]:text-black",
          info:
            "group-[.toaster]:bg-[hsl(200,100%,60%)] group-[.toaster]:text-black",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
