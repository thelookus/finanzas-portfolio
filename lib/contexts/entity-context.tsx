"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

interface Entity {
  id: number;
  name: string;
  type: "personal" | "business";
  currency: string;
}

interface EntityContextValue {
  entities: Entity[];
  currentEntity: Entity | null;
  setCurrentEntity: (entity: Entity) => void;
  refreshEntities: () => Promise<void>;
  loading: boolean;
}

const EntityContext = createContext<EntityContextValue | null>(null);

export function EntityProvider({ children }: { children: React.ReactNode }) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [currentEntity, setCurrentEntityState] = useState<Entity | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshEntities = useCallback(async () => {
    try {
      const res = await fetch("/api/finances/entities");
      const data = await res.json();
      setEntities(data);
      if (data.length > 0 && !currentEntity) {
        setCurrentEntityState(data[0]);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [currentEntity]);

  useEffect(() => {
    refreshEntities();
  }, [refreshEntities]);

  const setCurrentEntity = useCallback((entity: Entity) => {
    setCurrentEntityState(entity);
  }, []);

  return (
    <EntityContext.Provider value={{ entities, currentEntity, setCurrentEntity, refreshEntities, loading }}>
      {children}
    </EntityContext.Provider>
  );
}

export function useEntity() {
  const ctx = useContext(EntityContext);
  if (!ctx) throw new Error("useEntity must be used within EntityProvider");
  return ctx;
}
