"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useEntity } from "@/lib/contexts/entity-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus } from "@phosphor-icons/react";

export function EntitySwitcher() {
  const t = useTranslations("Finances");
  const { entities, currentEntity, setCurrentEntity, refreshEntities } = useEntity();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"personal" | "business">("personal");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/finances/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type }),
      });
      if (res.ok) {
        await refreshEntities();
        setName("");
        setShowCreate(false);
      }
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  }

  if (entities.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentEntity ? String(currentEntity.id) : ""}
        onValueChange={(val) => {
          const entity = entities.find((e) => e.id === Number(val));
          if (entity) setCurrentEntity(entity);
        }}
      >
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {entities.map((entity) => (
            <SelectItem key={entity.id} value={String(entity.id)}>
              {entity.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <Plus size={14} />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>{t("newEntity")}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleCreate} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("entityName")}</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("entityNamePlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("entityType")}</label>
              <Select value={type} onValueChange={(v) => setType(v as "personal" | "business")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">{t("personal")}</SelectItem>
                  <SelectItem value="business">{t("business")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? t("creating") : t("create")}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
