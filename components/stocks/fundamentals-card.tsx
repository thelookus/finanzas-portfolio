"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { QuoteData } from "@/types";
import { formatCurrency } from "@/lib/calculations";

interface FundamentalsCardProps {
  quote: QuoteData;
}

function Row({ label, value, tooltip }: { label: string; value: string | null; tooltip?: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground inline-flex items-center">{label}{tooltip && <InfoTooltip text={tooltip} />}</span>
      <span className="text-sm font-mono">{value ?? "N/A"}</span>
    </div>
  );
}

export function FundamentalsCard({ quote }: FundamentalsCardProps) {
  const t = useTranslations("Fundamentals");
  const fmt = (v: number | null) => (v != null ? formatCurrency(v) : null);
  const fmtNum = (v: number | null) => (v != null ? v.toFixed(2) : null);
  const fmtBig = (v: number | null) => {
    if (v == null) return null;
    if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
    return formatCurrency(v);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Row label={t("marketCap")} value={fmtBig(quote.marketCap)} tooltip={t("marketCapTooltip")} />
        <Row label={t("peTrailing")} value={fmtNum(quote.peRatio)} tooltip={t("peTrailingTooltip")} />
        <Row label={t("peForward")} value={fmtNum(quote.forwardPE)} tooltip={t("peForwardTooltip")} />
        <Row
          label={t("dividendYield")}
          value={
            quote.dividendYield != null
              ? `${(quote.dividendYield * 100).toFixed(2)}%`
              : null
          }
          tooltip={t("dividendYieldTooltip")}
        />
        <Row label={t("fiftyTwoWeekHigh")} value={fmt(quote.fiftyTwoWeekHigh)} tooltip={t("fiftyTwoWeekHighTooltip")} />
        <Row label={t("fiftyTwoWeekLow")} value={fmt(quote.fiftyTwoWeekLow)} tooltip={t("fiftyTwoWeekLowTooltip")} />
        <Row
          label={t("fiftyTwoWeekRange")}
          value={
            quote.fiftyTwoWeekHigh > 0
              ? t("fromBottom", {
                  percent: (
                    ((quote.price - quote.fiftyTwoWeekLow) /
                      (quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow)) *
                    100
                  ).toFixed(0),
                })
              : null
          }
        />
        <Row label={t("dayHigh")} value={fmt(quote.dayHigh)} />
        <Row label={t("dayLow")} value={fmt(quote.dayLow)} />
        <Row
          label={t("volume")}
          value={
            quote.volume > 0
              ? quote.volume.toLocaleString()
              : null
          }
        />
        <Row label={t("analystRating")} value={quote.averageAnalystRating} />
        <Row label={t("targetMean")} value={fmt(quote.targetMeanPrice)} tooltip={t("targetMeanTooltip")} />
        <Row label={t("targetHigh")} value={fmt(quote.targetHighPrice)} tooltip={t("targetHighTooltip")} />
        <Row label={t("targetLow")} value={fmt(quote.targetLowPrice)} tooltip={t("targetLowTooltip")} />
      </CardContent>
    </Card>
  );
}
