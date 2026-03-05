"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SMA } from "technicalindicators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PriceChart } from "@/components/charts/price-chart";
import { TechnicalPanel } from "@/components/stocks/technical-panel";
import { FundamentalsCard } from "@/components/stocks/fundamentals-card";
import { PositionCard } from "@/components/stocks/position-card";
import { AIAnalysisCard } from "@/components/stocks/ai-analysis-card";
import { formatCurrency, formatPercent } from "@/lib/calculations";
import { ArrowLeft } from "@phosphor-icons/react";
import type { CandleData, TechnicalAnalysis, QuoteData, Holding } from "@/types";

const RANGES = ["1mo", "3mo", "6mo", "1y", "2y"];

interface AnalysisResponse {
  candles: CandleData[];
  analysis: TechnicalAnalysis | null;
  quote: QuoteData | null;
}

export default function StockPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = use(params);
  const t = useTranslations("Stock");
  const [range, setRange] = useState("6mo");
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [holding, setHolding] = useState<Holding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/analysis?ticker=${ticker}&range=${range}`).then((r) =>
        r.json()
      ),
      fetch(`/api/portfolio?ticker=${ticker}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([analysisData, holdingData]) => {
      setData(analysisData);
      setHolding(holdingData);
      setLoading(false);
    });
  }, [ticker, range]);

  if (loading || !data) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  const { candles, analysis, quote } = data;

  // Compute SMA data for chart overlays
  const closes = candles.map((c) => c.close);
  const sma20 = SMA.calculate({ values: closes, period: 20 });
  const sma50 = SMA.calculate({ values: closes, period: 50 });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{ticker.toUpperCase()}</h1>
            {quote && (
              <span className="text-sm text-muted-foreground">
                {quote.name}
              </span>
            )}
          </div>
          {quote && (
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xl font-mono">
                {formatCurrency(quote.price)}
              </span>
              <Badge
                variant={quote.change >= 0 ? "default" : "destructive"}
              >
                {formatCurrency(quote.change)} ({formatPercent(quote.changePercent)})
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("priceChart")}</CardTitle>
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <Button
                key={r}
                variant={range === r ? "default" : "ghost"}
                size="sm"
                onClick={() => setRange(r)}
                className="text-xs"
              >
                {r.toUpperCase()}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {candles.length > 0 ? (
            <PriceChart candles={candles} sma20={sma20} sma50={sma50} />
          ) : (
            <p className="text-muted-foreground text-sm">
              {t("noChartData")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TechnicalPanel
          analysis={analysis}
          currentPrice={quote?.price ?? 0}
        />
        {quote && <FundamentalsCard quote={quote} />}
        {quote && <PositionCard holding={holding} quote={quote} />}
      </div>

      {/* AI Analysis */}
      <AIAnalysisCard ticker={ticker} />
    </div>
  );
}
