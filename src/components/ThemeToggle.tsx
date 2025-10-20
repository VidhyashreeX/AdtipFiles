import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative hover:bg-transparent"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 sm:h-6 sm:w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
      <Moon className="absolute h-5 w-5 sm:h-6 sm:w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
    </Button>
  );
}
