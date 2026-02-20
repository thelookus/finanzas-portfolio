"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { TechnicalAnalysis, Signal } from "@/types";

interface TechnicalPanelProps {
  analysis: TechnicalAnalysis | null;
  currentPrice: number;
}

function SignalBadge({ signal }: { signal: Signal }) {
  const variant =
    signal.type === "buy"
      ? "default"
      : signal.type === "sell"
      ? "destructive"
      : "secondary";

  return (
    <Badge variant={variant} className="text-xs">
      {signal.indicator}: {signal.message}
    </Badge>
  );
}

function IndicatorRow({
  label,
  value,
  price,
  tooltip,
}: {
  label: string;
  value: number | null;
  price: number;
  tooltip?: string;
}) {
  if (value === null) return null;
  const diff = ((price - value) / value) * 100;
  const above = price > value;

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground inline-flex items-center">{label}{tooltip && <InfoTooltip text={tooltip} />}</span>
      <div className="text-right">
        <span className="text-sm font-mono">${value.toFixed(2)}</span>
        <span
          className={`text-xs ml-2 ${
            above ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {diff >= 0 ? "+" : ""}
          {diff.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export function TechnicalPanel({ analysis, currentPrice }: TechnicalPanelProps) {
  const t = useTranslations("Technical");

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("noData")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const buySignals = analysis.signals.filter((s) => s.type === "buy");
  const sellSignals = analysis.signals.filter((s) => s.type === "sell");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* RSI */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium inline-flex items-center">{t("rsi")}<InfoTooltip text={t("rsiTooltip")} /></span>
            <span
              className={`text-sm font-mono ${
                analysis.rsi14 !== null
                  ? analysis.rsi14 < 30
                    ? "text-emerald-400"
                    : analysis.rsi14 > 70
                    ? "text-red-400"
                    : "text-muted-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {analysis.rsi14?.toFixed(1) ?? t("na")}
            </span>
          </div>
          {analysis.rsi14 !== null && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  analysis.rsi14 < 30
                    ? "bg-emerald-500"
                    : analysis.rsi14 > 70
                    ? "bg-red-500"
                    : "bg-blue-500"
                }`}
                style={{ width: `${analysis.rsi14}%` }}
              />
            </div>
          )}
        </div>

        {/* Moving Averages */}
        <div>
          <h4 className="text-sm font-medium mb-1">{t("movingAverages")}</h4>
          <IndicatorRow label="SMA(20)" value={analysis.sma20} price={currentPrice} tooltip={t("sma20Tooltip")} />
          <IndicatorRow label="SMA(50)" value={analysis.sma50} price={currentPrice} tooltip={t("sma50Tooltip")} />
          <IndicatorRow label="SMA(200)" value={analysis.sma200} price={currentPrice} tooltip={t("sma200Tooltip")} />
        </div>

        {/* MACD */}
        {analysis.macd && (
          <div>
            <h4 className="text-sm font-medium mb-1 inline-flex items-center">{t("macd")}<InfoTooltip text={t("macdTooltip")} /></h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">{t("macd")}</span>
                <div className="font-mono">{analysis.macd.macd.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">{t("signal")}</span>
                <div className="font-mono">{analysis.macd.signal.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">{t("histogram")}</span>
                <div
                  className={`font-mono ${
                    analysis.macd.histogram >= 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {analysis.macd.histogram.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bollinger Bands */}
        {analysis.bollingerBands && (
          <div>
            <h4 className="text-sm font-medium mb-1 inline-flex items-center">{t("bollinger")}<InfoTooltip text={t("bollingerTooltip")} /></h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">{t("upper")}</span>
                <div className="font-mono">
                  ${analysis.bollingerBands.upper.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">{t("middle")}</span>
                <div className="font-mono">
                  ${analysis.bollingerBands.middle.toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">{t("lower")}</span>
                <div className="font-mono">
                  ${analysis.bollingerBands.lower.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signals */}
        <div>
          <h4 className="text-sm font-medium mb-2">{t("signals")}</h4>
          <div className="flex flex-wrap gap-1.5">
            {buySignals.map((s, i) => (
              <SignalBadge key={`buy-${i}`} signal={s} />
            ))}
            {sellSignals.map((s, i) => (
              <SignalBadge key={`sell-${i}`} signal={s} />
            ))}
          </div>
          {analysis.signals.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("noSignals")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
