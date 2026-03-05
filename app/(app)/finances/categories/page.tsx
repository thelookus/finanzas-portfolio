"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useEntity } from "@/lib/contexts/entity-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EntitySwitcher } from "@/components/finances/entity-switcher";
import { EmptyState } from "@/components/finances/empty-state";
import {
  Plus,
  Tag,
  PencilSimple,
  Trash,
  ArrowDown,
  ArrowUp,
  ArrowsLeftRight,
} from "@phosphor-icons/react";

interface Category {
  id: number;
  entityId: number;
  name: string;
  parentId: number | null;
  type: "expense" | "income" | "transfer";
  icon: string | null;
  color: string | null;
  isTaxDeductible: number;
  sortOrder: number;
}

const TYPE_CONFIG = {
  expense: { icon: ArrowDown, color: "text-red-400", bg: "bg-red-400/10" },
  income: { icon: ArrowUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  transfer: { icon: ArrowsLeftRight, color: "text-blue-400", bg: "bg-blue-400/10" },
};

export default function CategoriesPage() {
  const t = useTranslations("Finances");
  const { currentEntity } = useEntity();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<Category["type"]>("expense");
  const [formParentId, setFormParentId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentEntity) return;
    setLoading(true);

    const res = await fetch(
      `/api/finances/categories?entityId=${currentEntity.id}`
    );
    const data: Category[] = await res.json();
    setCategories(data);
    setLoading(false);
  }, [currentEntity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreate() {
    setEditingCategory(null);
    setFormName("");
    setFormType("expense");
    setFormParentId("none");
    setDeleteError(null);
    setShowForm(true);
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setFormName(category.name);
    setFormType(category.type);
    setFormParentId(category.parentId ? String(category.parentId) : "none");
    setDeleteError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentEntity || !formName.trim()) return;
    setSaving(true);

    const parentId = formParentId && formParentId !== "none" ? Number(formParentId) : null;

    if (editingCategory) {
      await fetch("/api/finances/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCategory.id,
          name: formName,
          type: formType,
          parentId,
        }),
      });
    } else {
      await fetch("/api/finances/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: currentEntity.id,
          name: formName,
          type: formType,
          parentId: parentId ?? undefined,
        }),
      });
    }

    setSaving(false);
    setShowForm(false);
    fetchData();
  }

  async function handleDelete(category: Category) {
    if (!confirm(t("deleteCategoryConfirm"))) return;
    setDeleteError(null);

    const res = await fetch(`/api/finances/categories?id=${category.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      if (data.error === "CATEGORY_IN_USE") {
        setDeleteError(t("categoryInUse"));
      }
      return;
    }

    fetchData();
  }

  // Group categories by type
  const groupedByType = (["expense", "income", "transfer"] as const).map(
    (type) => {
      const all = categories.filter((c) => c.type === type);
      const parents = all.filter((c) => c.parentId === null);
      return {
        type,
        parents: parents.map((parent) => ({
          ...parent,
          children: all.filter((c) => c.parentId === parent.id),
        })),
      };
    }
  );

  // Available parent categories for the form (same type, not self, only root categories)
  const availableParents = categories.filter(
    (c) =>
      c.type === formType &&
      c.parentId === null &&
      c.id !== editingCategory?.id
  );

  const typeLabel = (type: string) => {
    if (type === "expense") return t("typeExpense");
    if (type === "income") return t("typeIncome");
    return t("typeTransfer");
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("categoriesTitle")}</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} className="mr-1" />
            {t("add")}
          </Button>
          <EntitySwitcher />
        </div>
      </div>

      {deleteError && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {deleteError}
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<Tag size={48} />}
          title={t("emptyCategoriesTitle")}
          description={t("emptyCategoriesDescription")}
          action={{ label: t("addCategory"), onClick: openCreate }}
        />
      ) : (
        <div className="space-y-6">
          {groupedByType.map(({ type, parents }) => {
            if (parents.length === 0) return null;
            const config = TYPE_CONFIG[type];
            const TypeIcon = config.icon;

            return (
              <Card key={type}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className={`p-1.5 rounded-md ${config.bg}`}>
                      <TypeIcon size={16} className={config.color} />
                    </div>
                    {typeLabel(type)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-1">
                    {parents.map((parent) => (
                      <div key={parent.id}>
                        {/* Parent category */}
                        <div className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-accent/50 group">
                          <span className="text-sm font-medium">
                            {parent.name}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                              onClick={() => openEdit(parent)}
                            >
                              <PencilSimple size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(parent)}
                            >
                              <Trash size={14} />
                            </Button>
                          </div>
                        </div>
                        {/* Children categories */}
                        {parent.children.map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center justify-between py-2 px-2 pl-8 rounded-md hover:bg-accent/50 group"
                          >
                            <span className="text-sm text-muted-foreground">
                              {child.name}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground"
                                onClick={() => openEdit(child)}
                              >
                                <PencilSimple size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDelete(child)}
                              >
                                <Trash size={14} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm} modal={false}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingCategory ? t("editCategory") : t("addCategory")}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-4 px-6 pb-6 space-y-4">
            <div className="space-y-2">
              <Label>{t("categoryName")}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t("categoryName")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("categoryType")}</Label>
              <Select
                value={formType}
                onValueChange={(v) => {
                  setFormType(v as Category["type"]);
                  setFormParentId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">{t("typeExpense")}</SelectItem>
                  <SelectItem value="income">{t("typeIncome")}</SelectItem>
                  <SelectItem value="transfer">{t("typeTransfer")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("parentCategory")}</Label>
              <Select
                value={formParentId}
                onValueChange={setFormParentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("noneParent")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noneParent")}</SelectItem>
                  {availableParents.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving
                ? t("saving")
                : editingCategory
                ? t("update")
                : t("create")}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
