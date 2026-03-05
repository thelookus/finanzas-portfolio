import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getPortfolio, getWatchlist } from "@/lib/portfolio";
import { getQuotes, getChart } from "@/lib/yahoo-finance";
import { computeTechnicalAnalysis } from "@/lib/technical-analysis";
import { scoreOpportunity } from "@/lib/scanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { OpportunitiesGuideDialog } from "@/components/opportunities/guide-dialog";
import { formatCurrency } from "@/lib/calculations";
import { Opportunity } from "@/types";

export const dynamic = "force-dynamic";

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : score >= 50
      ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      : "bg-red-500/20 text-red-400 border-red-500/30";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${color}`}
    >
      {score}
    </span>
  );
}

async function OpportunitiesContent() {
  const t = await getTranslations("Opportunities");
  const portfolio = getPortfolio();
  const watchlist = getWatchlist();

  const allTickers = [
    ...new Set([
      ...portfolio.holdings.map((h) => h.ticker),
      ...watchlist.map((w) => w.ticker),
    ]),
  ];

  const quotes = await getQuotes(allTickers);

  // Fetch chart data for all tickers (use 1y for SMA200)
  const chartsPromises = allTickers.map(async (ticker) => {
    const candles = await getChart(ticker, "1y");
    return { ticker, candles };
  });
  const chartsResults = await Promise.allSettled(chartsPromises);

  const opportunities: Opportunity[] = [];

  for (const result of chartsResults) {
    if (result.status !== "fulfilled") continue;
    const { ticker, candles } = result.value;
    const quote = quotes.get(ticker);
    if (!quote || candles.length === 0) continue;

    const analysis = computeTechnicalAnalysis(ticker, candles);
    const opportunity = scoreOpportunity(quote, analysis);
    opportunities.push(opportunity);
  }

  opportunities.sort((a, b) => b.score - a.score);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <OpportunitiesGuideDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("scanner")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("ticker")}</TableHead>
                  <TableHead className="text-right">{t("price")}</TableHead>
                  <TableHead className="text-center">
                    <span className="inline-flex items-center">{t("score")}<InfoTooltip text={t("scoreTooltip")} /></span>
                  </TableHead>
                  <TableHead className="text-right">{t("rsi")}</TableHead>
                  <TableHead className="text-right hidden md:table-cell">
                    <span className="inline-flex items-center">{t("vsSMA200")}<InfoTooltip text={t("vsSMA200Tooltip")} /></span>
                  </TableHead>
                  <TableHead className="text-right hidden md:table-cell">
                    <span className="inline-flex items-center">{t("vs52WLow")}<InfoTooltip text={t("vs52WLowTooltip")} /></span>
                  </TableHead>
                  <TableHead className="text-right hidden lg:table-cell">
                    <span className="inline-flex items-center">{t("analystUpside")}<InfoTooltip text={t("analystUpsideTooltip")} /></span>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">{t("signals")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((opp) => (
                  <TableRow key={opp.ticker} className="hover:bg-accent/50">
                    <TableCell>
                      <Link
                        href={`/stocks/${opp.ticker}`}
                        className="font-medium hover:underline"
                      >
                        {opp.ticker}
                      </Link>
                      <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {opp.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(opp.price)}
                    </TableCell>
                    <TableCell className="text-center">
                      <ScoreBadge score={opp.score} />
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-mono text-sm ${
                          opp.rsi !== null && opp.rsi < 30
                            ? "text-emerald-400"
                            : opp.rsi !== null && opp.rsi > 70
                            ? "text-red-400"
                            : ""
                        }`}
                      >
                        {opp.rsi?.toFixed(1) ?? t("na")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell font-mono text-sm">
                      {opp.distanceFromSMA200 != null
                        ? `${opp.distanceFromSMA200 >= 0 ? "+" : ""}${opp.distanceFromSMA200.toFixed(1)}%`
                        : t("na")}
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell font-mono text-sm">
                      {opp.distanceFrom52WLow != null
                        ? `+${opp.distanceFrom52WLow.toFixed(1)}%`
                        : t("na")}
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell font-mono text-sm">
                      {opp.belowAnalystTarget != null ? (
                        <span
                          className={
                            opp.belowAnalystTarget > 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }
                        >
                          {opp.belowAnalystTarget >= 0 ? "+" : ""}
                          {opp.belowAnalystTarget.toFixed(1)}%
                        </span>
                      ) : (
                        t("na")
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {opp.signals
                          .filter((s) => s.type !== "neutral")
                          .slice(0, 3)
                          .map((s, i) => (
                            <Badge
                              key={i}
                              variant={
                                s.type === "buy" ? "default" : "destructive"
                              }
                              className="text-[10px]"
                            >
                              {s.indicator}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OpportunitiesSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<OpportunitiesSkeleton />}>
      <OpportunitiesContent />
    </Suspense>
  );
}
