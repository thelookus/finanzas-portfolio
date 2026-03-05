"use client";

import { useTheme } from "@/lib/contexts/theme-context";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "@phosphor-icons/react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  function toggle() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="w-full justify-start gap-3 px-3"
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      {theme === "dark" ? "Light" : "Dark"}
    </Button>
  );
}
