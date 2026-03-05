"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ModuleId } from "@/lib/modules";

interface ModuleContextValue {
  enabledModules: ModuleId[];
  isModuleEnabled: (moduleId: ModuleId) => boolean;
  toggleModule: (moduleId: ModuleId, enabled: boolean) => Promise<void>;
  loading: boolean;
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const [enabledModules, setEnabledModules] = useState<ModuleId[]>(["portfolio", "finances"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.enabledModules) {
          setEnabledModules(data.enabledModules);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isModuleEnabled = useCallback(
    (moduleId: ModuleId) => enabledModules.includes(moduleId),
    [enabledModules]
  );

  const toggleModuleFn = useCallback(
    async (moduleId: ModuleId, enabled: boolean) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId, enabled }),
      });
      const data = await res.json();
      if (data.enabledModules) {
        setEnabledModules(data.enabledModules);
      }
    },
    []
  );

  return (
    <ModuleContext.Provider value={{ enabledModules, isModuleEnabled, toggleModule: toggleModuleFn, loading }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  const ctx = useContext(ModuleContext);
  if (!ctx) throw new Error("useModules must be used within ModuleProvider");
  return ctx;
}
