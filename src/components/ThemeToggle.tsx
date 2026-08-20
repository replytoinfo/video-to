
import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className={`h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-transform transition-opacity ${theme === "dark" ? "opacity-0" : "opacity-100"}`} />
            <Moon className={`absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-transform transition-opacity ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "opacity-0"}`} />
            <span className="sr-only">{t("toggleTheme")}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{theme === "dark" ? t("lightMode") : t("darkMode")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
