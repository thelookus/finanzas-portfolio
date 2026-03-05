"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface BudgetItem {
  categoryName: string;
  budgeted: number;
  spent: number;
}

interface BudgetProgressProps {
  items: BudgetItem[];
  currency?: string;
}

function formatMoney(amount: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function BudgetProgress({ items, currency = "ARS" }: BudgetProgressProps) {
  const t = useTranslations("Finances");

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("budgets")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">{t("noBudgets")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("budgets")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => {
          const percent = item.budgeted > 0 ? (item.spent / item.budgeted) * 100 : 0;
          const colorClass = percent > 100 ? "text-red-400" : percent > 80 ? "text-yellow-400" : "text-emerald-400";

          return (
            <div key={item.categoryName} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate">{item.categoryName}</span>
                <span className={`font-mono text-xs ${colorClass}`}>
                  {formatMoney(item.spent, currency)} / {formatMoney(item.budgeted, currency)}
                </span>
              </div>
              <Progress
                value={Math.min(percent, 100)}
                className="h-2"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
