"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPercent } from "@/lib/calculations";
import { Trash, Plus } from "@phosphor-icons/react";
import type { WatchlistItem, QuoteData } from "@/types";

export default function WatchlistPage() {
  const t = useTranslations("Watchlist");
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [newTicker, setNewTicker] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const res = await fetch("/api/watchlist");
    const watchlist: WatchlistItem[] = await res.json();
    setItems(watchlist);

    if (watchlist.length > 0) {
      const tickers = watchlist.map((w) => w.ticker).join(",");
      const quotesRes = await fetch(`/api/quotes?tickers=${tickers}`);
      const quotesData = await quotesRes.json();
      setQuotes(quotesData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addTicker = async () => {
    if (!newTicker.trim()) return;
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: newTicker.trim().toUpperCase() }),
    });
    setNewTicker("");
    fetchData();
  };

  const removeTicker = async (ticker: string) => {
    await fetch(`/api/watchlist?ticker=${ticker}`, { method: "DELETE" });
    fetchData();
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("addTicker")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTicker();
            }}
            className="flex gap-2"
          >
            <Input
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value)}
              placeholder={t("placeholder")}
              className="max-w-xs"
            />
            <Button type="submit">
              <Plus size={16} className="mr-1" />
              {t("add")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {t("empty")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("ticker")}</TableHead>
                    <TableHead className="text-right">{t("price")}</TableHead>
                    <TableHead className="text-right">{t("change")}</TableHead>
                    <TableHead className="text-right hidden md:table-cell">
                      {t("dayHigh")}
                    </TableHead>
                    <TableHead className="text-right hidden md:table-cell">
                      {t("dayLow")}
                    </TableHead>
                    <TableHead className="text-right hidden lg:table-cell">
                      {t("fiftyTwoWeekRange")}
                    </TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const q = quotes[item.ticker];
                    return (
                      <TableRow key={item.ticker} className="hover:bg-accent/50">
                        <TableCell>
                          <Link
                            href={`/stocks/${item.ticker}`}
                            className="font-medium hover:underline"
                          >
                            {item.ticker}
                          </Link>
                          {q && (
                            <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                              {q.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {q ? formatCurrency(q.price) : "..."}
                        </TableCell>
                        <TableCell className="text-right">
                          {q ? (
                            <span
                              className={`font-mono text-sm ${
                                q.change >= 0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {formatPercent(q.changePercent)}
                            </span>
                          ) : (
                            "..."
                          )}
                        </TableCell>
                        <TableCell className="text-right hidden md:table-cell font-mono text-sm">
                          {q ? formatCurrency(q.dayHigh) : "..."}
                        </TableCell>
                        <TableCell className="text-right hidden md:table-cell font-mono text-sm">
                          {q ? formatCurrency(q.dayLow) : "..."}
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell font-mono text-sm">
                          {q
                            ? `${formatCurrency(q.fiftyTwoWeekLow)} - ${formatCurrency(q.fiftyTwoWeekHigh)}`
                            : "..."}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTicker(item.ticker)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-400"
                          >
                            <Trash size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
