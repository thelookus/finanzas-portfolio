"use client";

import { SessionProvider } from "next-auth/react";
import { ModuleProvider } from "@/lib/contexts/module-context";
import { EntityProvider } from "@/lib/contexts/entity-context";
import { ThemeProvider } from "@/lib/contexts/theme-context";

export function Providers({ children, theme }: { children: React.ReactNode; theme?: "light" | "dark" }) {
  return (
    <SessionProvider>
      <ThemeProvider initialTheme={theme ?? "dark"}>
        <ModuleProvider>
          <EntityProvider>
            {children}
          </EntityProvider>
        </ModuleProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
