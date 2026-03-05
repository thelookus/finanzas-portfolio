"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useEntity } from "@/lib/contexts/entity-context";
import { MonthlySummary } from "@/components/finances/monthly-summary";
import { CategoryBreakdown } from "@/components/finances/category-breakdown";
import { RecentTransactions } from "@/components/finances/recent-transactions";
import { BudgetProgress } from "@/components/finances/budget-progress";
import { EntitySwitcher } from "@/components/finances/entity-switcher";
import { QuickAddFAB } from "@/components/finances/quick-add-fab";
import { EmptyState } from "@/components/finances/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet } from "@phosphor-icons/react";

interface CategoryTotal {
  categoryId: number | null;
  type: string;
  total: number;
}

export default function FinancesDashboard() {
  const t = useTranslations("Finances");
  const { currentEntity } = useEntity();
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const [categoryData, setCategoryData] = useState<{ name: string; total: number }[]>([]);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [budgetItems, setBudgetItems] = useState<any[]>([]);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    if (!currentEntity) return;
    setLoading(true);

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    Promise.all([
      fetch(`/api/finances/reports?entityId=${currentEntity.id}&year=${year}&month=${month}`).then((r) => r.json()),
      fetch(`/api/finances/transactions?entityId=${currentEntity.id}&limit=10`).then((r) => r.json()),
      fetch(`/api/finances/budgets?entityId=${currentEntity.id}&year=${year}&month=${month}`).then((r) => r.json()),
      fetch(`/api/finances/categories?entityId=${currentEntity.id}`).then((r) => r.json()),
    ]).then(([report, txs, budgets, categories]) => {
      // Calculate totals
      const totals = report as CategoryTotal[];
      const inc = totals.filter((t: CategoryTotal) => t.type === "income").reduce((s: number, t: CategoryTotal) => s + t.total, 0);
      const exp = totals.filter((t: CategoryTotal) => t.type === "expense").reduce((s: number, t: CategoryTotal) => s + t.total, 0);
      setIncome(inc);
      setExpense(exp);

      // Category breakdown (expenses only)
      const catMap = new Map(categories.map((c: any) => [c.id, c.name]));
      const expenseByCategory = totals
        .filter((t: CategoryTotal) => t.type === "expense" && t.categoryId)
        .map((t: CategoryTotal) => ({
          name: (catMap.get(t.categoryId!) as string) || String(t.categoryId),
          total: t.total,
        }))
        .sort((a: any, b: any) => b.total - a.total);
      setCategoryData(expenseByCategory);

      // Recent transactions with category names
      setRecentTx(
        txs.map((tx: any) => ({
          ...tx,
          categoryName: catMap.get(tx.categoryId) || "",
        }))
      );

      // Budget progress
      const budgetData = budgets.map((b: any) => ({
        categoryName: catMap.get(b.categoryId) || "",
        budgeted: b.budgetedAmount,
        spent: totals.find((t: CategoryTotal) => t.categoryId === b.categoryId && t.type === "expense")?.total || 0,
      }));
      setBudgetItems(budgetData);

      setLoading(false);
    });
  }, [currentEntity]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const isEmpty = income === 0 && expense === 0 && recentTx.length === 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("dashboardTitle")}</h1>
        <EntitySwitcher />
      </div>

      {isEmpty ? (
        <EmptyState
          icon={<Wallet size={48} />}
          title={t("emptyDashboardTitle")}
          description={t("emptyDashboardDescription")}
          action={{ label: t("addTransaction"), onClick: () => setQuickAddOpen(true) }}
          secondaryAction={{ label: t("import"), onClick: () => window.location.href = "/finances/transactions" }}
        />
      ) : (
        <>
          <MonthlySummary
            income={income}
            expense={expense}
            currency={currentEntity?.currency}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryBreakdown data={categoryData} currency={currentEntity?.currency} />
            <RecentTransactions transactions={recentTx} currency={currentEntity?.currency} />
          </div>

          <BudgetProgress items={budgetItems} currency={currentEntity?.currency} />
        </>
      )}

      <QuickAddFAB externalOpen={quickAddOpen} onExternalOpenChange={setQuickAddOpen} />
    </div>
  );
}
