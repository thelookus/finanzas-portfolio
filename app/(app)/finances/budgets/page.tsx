"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useEntity } from "@/lib/contexts/entity-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EntitySwitcher } from "@/components/finances/entity-switcher";
import { EmptyState } from "@/components/finances/empty-state";
import { CaretLeft, CaretRight, ChartPie } from "@phosphor-icons/react";

interface Budget {
  id: number;
  categoryId: number;
  budgetedAmount: number;
}

interface CategoryTotal {
  categoryId: number | null;
  type: string;
  total: number;
}

interface Category {
  id: number;
  name: string;
  type: string;
  parentId: number | null;
}

function formatMoney(amount: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function BudgetsPage() {
  const t = useTranslations("Finances");
  const { currentEntity } = useEntity();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spending, setSpending] = useState<CategoryTotal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");

  const fetchData = useCallback(async () => {
    if (!currentEntity) return;
    setLoading(true);

    const [budgetsRes, reportRes, catsRes] = await Promise.all([
      fetch(`/api/finances/budgets?entityId=${currentEntity.id}&year=${year}&month=${month}`).then((r) => r.json()),
      fetch(`/api/finances/reports?entityId=${currentEntity.id}&year=${year}&month=${month}`).then((r) => r.json()),
      fetch(`/api/finances/categories?entityId=${currentEntity.id}`).then((r) => r.json()),
    ]);

    setBudgets(budgetsRes);
    setSpending(reportRes);
    setCategories(catsRes);
    setLoading(false);
  }, [currentEntity, year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const expenseCategories = categories.filter((c) => c.type === "expense" && c.parentId === null);

  function getSpent(categoryId: number) {
    // Sum this category + its children
    const childIds = categories.filter((c) => c.parentId === categoryId).map((c) => c.id);
    const allIds = [categoryId, ...childIds];
    return spending
      .filter((s) => s.type === "expense" && allIds.includes(s.categoryId as number))
      .reduce((sum, s) => sum + s.total, 0);
  }

  function getBudgeted(categoryId: number) {
    return budgets.find((b) => b.categoryId === categoryId)?.budgetedAmount ?? 0;
  }

  async function saveBudget(categoryId: number) {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) return;

    await fetch("/api/finances/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityId: currentEntity!.id,
        categoryId,
        year,
        month,
        budgetedAmount: amount,
      }),
    });

    setEditingId(null);
    fetchData();
  }

  function changeMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    setMonth(newMonth);
    setYear(newYear);
  }

  const totalBudgeted = expenseCategories.reduce((s, c) => s + getBudgeted(c.id), 0);
  const totalSpent = expenseCategories.reduce((s, c) => s + getSpent(c.id), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("budgetsTitle")}</h1>
        <EntitySwitcher />
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
          <CaretLeft size={20} />
        </Button>
        <span className="text-lg font-medium w-40 text-center">
          {MONTHS_ES[month - 1]} {year}
        </span>
        <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
          <CaretRight size={20} />
        </Button>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">{t("totalBudgeted")}</span>
            <span className="font-mono">{formatMoney(totalBudgeted, currentEntity?.currency)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">{t("totalSpent")}</span>
            <span className={`font-mono ${totalSpent > totalBudgeted && totalBudgeted > 0 ? "text-red-400" : ""}`}>
              {formatMoney(totalSpent, currentEntity?.currency)}
            </span>
          </div>
          {totalBudgeted > 0 && (
            <Progress value={Math.min((totalSpent / totalBudgeted) * 100, 100)} className="h-2 mt-2" />
          )}
        </CardContent>
      </Card>

      {loading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : budgets.length === 0 && totalSpent === 0 ? (
        <EmptyState
          icon={<ChartPie size={48} />}
          title={t("emptyBudgetsTitle")}
          description={t("emptyBudgetsDescription")}
          action={{ label: t("createBudget"), onClick: () => {
            if (expenseCategories.length > 0) {
              setEditingId(expenseCategories[0].id);
              setEditAmount("0");
            }
          }}}
        />
      ) : (
        <div className="space-y-3">
          {expenseCategories.map((cat) => {
            const budgeted = getBudgeted(cat.id);
            const spent = getSpent(cat.id);
            const percent = budgeted > 0 ? (spent / budgeted) * 100 : 0;
            const colorClass = percent > 100 ? "text-red-400" : percent > 80 ? "text-yellow-400" : "text-emerald-400";
            const isEditing = editingId === cat.id;

            return (
              <Card key={cat.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{cat.name}</span>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="h-7 w-28 text-right text-sm"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === "Enter") saveBudget(cat.id); if (e.key === "Escape") setEditingId(null); }}
                        />
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => saveBudget(cat.id)}>
                          OK
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs font-mono"
                        onClick={() => { setEditingId(cat.id); setEditAmount(String(budgeted)); }}
                      >
                        {budgeted > 0 ? formatMoney(budgeted, currentEntity?.currency) : t("setBudget")}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className={`font-mono ${colorClass}`}>
                      {formatMoney(spent, currentEntity?.currency)}
                    </span>
                    {budgeted > 0 && (
                      <span className="text-muted-foreground">
                        {percent.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {budgeted > 0 && (
                    <Progress value={Math.min(percent, 100)} className="h-1.5" />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
