"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Lightning } from "@phosphor-icons/react";

interface UsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  totalRequests: number;
  byFeature: Record<string, { requests: number; costUsd: number }>;
  byDate: Record<string, { requests: number; costUsd: number }>;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function AIUsageFooter() {
  const t = useTranslations("Usage");
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [expanded, setExpanded] = useState(false);

  const FEATURE_LABELS: Record<string, string> = {
    advisor: t("advisor"),
    analysis: t("analysis"),
    discovery: t("discovery"),
    dca: t("dca"),
  };

  const fetchUsage = useCallback(() => {
    fetch("/api/ai/usage")
      .then((r) => (r.ok ? r.json() : null))
      .then(setUsage)
      .catch(() => null);
  }, []);

  useEffect(() => {
    fetchUsage();

    // Refetch when tab regains focus (after user makes AI requests)
    function onFocus() {
      fetchUsage();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchUsage]);

  const totalCost = usage?.totalCostUsd ?? 0;
  const totalReqs = usage?.totalRequests ?? 0;
  const todayKey = new Date().toISOString().split("T")[0];
  const todayUsage = usage?.byDate[todayKey];

  return (
    <div className="border-t border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Lightning size={12} />
            <span>AI: ${totalCost.toFixed(4)}</span>
          </div>
          <span>{totalReqs} req</span>
        </div>
        {todayUsage && (
          <div className="mt-1 text-muted-foreground/70">
            {t("today", { requests: todayUsage.requests, cost: todayUsage.costUsd.toFixed(4) })}
          </div>
        )}
      </button>
      {expanded && usage && totalReqs > 0 && (
        <div className="px-4 pb-4 space-y-2 text-xs">
          <div className="text-muted-foreground/70">
            {t("tokens", { input: formatTokens(usage.totalInputTokens), output: formatTokens(usage.totalOutputTokens) })}
          </div>
          <div className="space-y-1">
            {Object.entries(usage.byFeature)
              .sort(([, a], [, b]) => b.costUsd - a.costUsd)
              .map(([feature, data]) => (
                <div key={feature} className="flex justify-between text-muted-foreground">
                  <span>{FEATURE_LABELS[feature] ?? feature}</span>
                  <span>
                    {data.requests}x / ${data.costUsd.toFixed(4)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
