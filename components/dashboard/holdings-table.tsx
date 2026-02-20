"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { HoldingWithQuote } from "@/types";
import { formatCurrency, formatPercent, formatShares } from "@/lib/calculations";

interface HoldingsTableProps {
  holdings: HoldingWithQuote[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  const t = useTranslations("Holdings");

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("ticker")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("sector")}</TableHead>
            <TableHead className="text-right">{t("shares")}</TableHead>
            <TableHead className="text-right">
              <span className="inline-flex items-center">{t("avgCost")}<InfoTooltip text={t("avgCostTooltip")} /></span>
            </TableHead>
            <TableHead className="text-right">{t("price")}</TableHead>
            <TableHead className="text-right">{t("value")}</TableHead>
            <TableHead className="text-right">
              <span className="inline-flex items-center">{t("pnl")}<InfoTooltip text={t("pnlTooltip")} /></span>
            </TableHead>
            <TableHead className="text-right hidden lg:table-cell">
              <span className="inline-flex items-center">{t("daily")}<InfoTooltip text={t("dailyTooltip")} /></span>
            </TableHead>
            <TableHead className="text-right hidden lg:table-cell">
              <span className="inline-flex items-center">{t("weight")}<InfoTooltip text={t("weightTooltip")} /></span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((h) => (
            <TableRow key={h.ticker} className="hover:bg-accent/50">
              <TableCell>
                <Link
                  href={`/stocks/${h.ticker}`}
                  className="font-medium hover:underline"
                >
                  {h.ticker}
                </Link>
                <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {h.quote.name}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant="secondary" className="text-xs font-normal">
                  {h.sector}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatShares(h.totalShares)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatCurrency(h.avgCost)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatCurrency(h.quote.price)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-medium">
                {formatCurrency(h.currentValue)}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={`font-mono text-sm ${
                    h.pnl >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {formatCurrency(h.pnl)}
                </span>
                <div
                  className={`text-xs ${
                    h.pnlPercent >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {formatPercent(h.pnlPercent)}
                </div>
              </TableCell>
              <TableCell className="text-right hidden lg:table-cell">
                <span
                  className={`font-mono text-sm ${
                    h.dailyChange >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {formatPercent(h.dailyChangePercent)}
                </span>
              </TableCell>
              <TableCell className="text-right hidden lg:table-cell font-mono text-sm">
                {h.weight.toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
