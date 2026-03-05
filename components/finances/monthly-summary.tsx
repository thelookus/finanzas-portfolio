"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { TrendUp, TrendDown, Wallet, ChartLineUp } from "@phosphor-icons/react";

interface MonthlySummaryProps {
  income: number;
  expense: number;
  prevIncome?: number;
  prevExpense?: number;
  currency?: string;
}

function formatMoney(amount: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function percentChange(current: number, prev: number) {
  if (prev === 0) return current > 0 ? 100 : 0;
  return ((current - prev) / prev) * 100;
}

export function MonthlySummary({ income, expense, prevIncome, prevExpense, currency = "ARS" }: MonthlySummaryProps) {
  const t = useTranslations("Finances");
  const balance = income - expense;
  const prevBalance = (prevIncome ?? 0) - (prevExpense ?? 0);
  const balanceChange = prevBalance !== 0 ? percentChange(balance, prevBalance) : undefined;

  const cards = [
    {
      label: t("income"),
      value: formatMoney(income, currency),
      icon: TrendUp,
      color: "text-emerald-400",
      bgColor: "bg-emerald-400/10",
      change: prevIncome !== undefined ? percentChange(income, prevIncome) : undefined,
    },
    {
      label: t("expenses"),
      value: formatMoney(expense, currency),
      icon: TrendDown,
      color: "text-red-400",
      bgColor: "bg-red-400/10",
      change: prevExpense !== undefined ? percentChange(expense, prevExpense) : undefined,
    },
    {
      label: t("balance"),
      value: formatMoney(balance, currency),
      icon: Wallet,
      color: balance >= 0 ? "text-emerald-400" : "text-red-400",
      bgColor: balance >= 0 ? "bg-emerald-400/10" : "bg-red-400/10",
      change: balanceChange,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                {card.change !== undefined && (
                  <p className={`text-xs mt-1 ${card.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {card.change >= 0 ? "+" : ""}{card.change.toFixed(1)}% {t("vsLastMonth")}
                  </p>
                )}
              </div>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon size={20} className={card.color} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
