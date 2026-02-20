"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { AIMarkdown } from "@/components/ui/ai-markdown";
import { ClockCounterClockwise, CaretDown, CaretUp, Trash } from "@phosphor-icons/react";

interface HistoryEntry {
  id: string;
  type: string;
  date: string;
  content: string;
  metadata: Record<string, unknown>;
}

interface AIHistoryProps {
  type: "advisor" | "analysis" | "discovery" | "dca";
  ticker?: string;
}

export function AIHistory({ type, ticker }: AIHistoryProps) {
  const t = useTranslations("AIHistory");
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const params = ticker
        ? `?ticker=${ticker}`
        : `?type=${type}`;
      const res = await fetch(`/api/ai/history${params}`);
      if (res.ok) {
        const data = await res.json();
        // Filter by type if fetched by ticker (ticker endpoint returns all types)
        const filtered = ticker
          ? data.filter((e: HistoryEntry) => e.type === type)
          : data;
        setEntries(filtered);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  }, [type, ticker]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/ai/history?id=${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error("Error deleting entry:", err);
    }
  }

  function getEntryLabel(entry: HistoryEntry): string {
    switch (entry.type) {
      case "advisor":
        return t("advisor");
      case "analysis":
        return t("analysis", { ticker: String(entry.metadata.ticker ?? "stock") });
      case "discovery":
        return String(entry.metadata.query ?? t("discovery"));
      case "dca":
        return t("dca", { budget: String(entry.metadata.budget ?? "?") });
      default:
        return t("entry");
    }
  }

  if (loading || entries.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2 mb-3">
        <ClockCounterClockwise size={16} className="text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          {t("title", { count: entries.length })}
        </span>
      </div>
      <div className="space-y-2">
        {entries.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const label = getEntryLabel(entry);

          return (
            <div
              key={entry.id}
              className="rounded-md border border-border bg-card/50"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent/50 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-muted-foreground text-xs shrink-0">
                    {format(new Date(entry.date), "dd/MM/yy HH:mm")}
                  </span>
                  <span className="truncate text-foreground/80">{label}</span>
                </div>
                {isExpanded ? (
                  <CaretUp size={14} className="shrink-0 text-muted-foreground" />
                ) : (
                  <CaretDown size={14} className="shrink-0 text-muted-foreground" />
                )}
              </button>
              {isExpanded && (
                <div className="px-3 pb-3 pt-1">
                  <AIMarkdown content={entry.content} />
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash size={12} />
                      {t("delete")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
