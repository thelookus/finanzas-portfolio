"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Holding, QuoteData } from "@/types";
import { formatCurrency, formatPercent, formatShares, getAvgCost, getPnL } from "@/lib/calculations";
import { format } from "date-fns";

interface PositionCardProps {
  holding: Holding | null;
  quote: QuoteData;
}

export function PositionCard({ holding, quote }: PositionCardProps) {
  const t = useTranslations("Position");

  if (!holding) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("noPosition", { ticker: quote.ticker })}
          </p>
        </CardContent>
      </Card>
    );
  }

  const avgCost = getAvgCost(holding);
  const { currentValue, pnl, pnlPercent } = getPnL(holding, quote.price);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-muted-foreground">{t("shares")}</span>
            <div className="font-mono text-sm">{formatShares(holding.totalShares)}</div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground inline-flex items-center">{t("avgCost")}<InfoTooltip text={t("avgCostTooltip")} /></span>
            <div className="font-mono text-sm">{formatCurrency(avgCost)}</div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground inline-flex items-center">{t("totalInvested")}<InfoTooltip text={t("totalInvestedTooltip")} /></span>
            <div className="font-mono text-sm">{formatCurrency(holding.totalInvested)}</div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground inline-flex items-center">{t("currentValue")}<InfoTooltip text={t("currentValueTooltip")} /></span>
            <div className="font-mono text-sm">{formatCurrency(currentValue)}</div>
          </div>
          <div>
            <span className="text-xs text-muted-foreground inline-flex items-center">{t("pnl")}<InfoTooltip text={t("pnlTooltip")} /></span>
            <div
              className={`font-mono text-sm ${
                pnl >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {formatCurrency(pnl)} ({formatPercent(pnlPercent)})
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">{t("transactions")}</h4>
          <div className="space-y-1.5">
            {holding.transactions.map((txn, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0"
              >
                <span className="text-muted-foreground">
                  {format(new Date(txn.date), "MMM d, yyyy")}
                </span>
                <span className="font-mono">
                  {formatShares(txn.shares)} @ {formatCurrency(txn.pricePerShare)}
                </span>
                <span className="font-mono">{formatCurrency(txn.costUsd)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
