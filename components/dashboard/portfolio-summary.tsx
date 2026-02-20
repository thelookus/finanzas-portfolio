"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { HoldingWithQuote } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/calculations";
import {
  Wallet,
  CurrencyDollar,
  TrendUp,
  ChartLineUp,
} from "@phosphor-icons/react";

interface PortfolioSummaryProps {
  holdings: HoldingWithQuote[];
  totalInvested: number;
  totalDividends: number;
}

export function PortfolioSummary({
  holdings,
  totalInvested,
  totalDividends,
}: PortfolioSummaryProps) {
  const t = useTranslations("Dashboard");
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPnL = totalValue - totalInvested;
  const totalPnLPercent =
    totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const dailyChange = holdings.reduce((sum, h) => sum + h.dailyChange, 0);
  const dailyChangePercent =
    totalValue > 0
      ? (dailyChange / (totalValue - dailyChange)) * 100
      : 0;

  const cards = [
    {
      title: t("totalValue"),
      tooltip: t("totalValueTooltip"),
      value: formatCurrency(totalValue),
      sub: t("positions", { count: holdings.length }),
      icon: Wallet,
      color: "text-blue-400",
    },
    {
      title: t("totalInvested"),
      tooltip: t("totalInvestedTooltip"),
      value: formatCurrency(totalInvested),
      sub: t("dividendsSub", { amount: formatCurrency(totalDividends) }),
      icon: CurrencyDollar,
      color: "text-purple-400",
    },
    {
      title: t("totalPnL"),
      tooltip: t("totalPnLTooltip"),
      value: formatCurrency(totalPnL),
      sub: formatPercent(totalPnLPercent),
      icon: TrendUp,
      color: totalPnL >= 0 ? "text-emerald-400" : "text-red-400",
    },
    {
      title: t("dailyChange"),
      tooltip: t("dailyChangeTooltip"),
      value: formatCurrency(dailyChange),
      sub: formatPercent(dailyChangePercent),
      icon: ChartLineUp,
      color: dailyChange >= 0 ? "text-emerald-400" : "text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              {card.title}
              <InfoTooltip text={card.tooltip} />
            </CardTitle>
            <card.icon size={20} className={card.color} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p
              className={`text-xs mt-1 ${
                card.color.includes("emerald")
                  ? "text-emerald-400"
                  : card.color.includes("red")
                  ? "text-red-400"
                  : "text-muted-foreground"
              }`}
            >
              {card.sub}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
