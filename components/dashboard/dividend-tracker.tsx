"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
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
import { Dividend } from "@/types";
import { formatCurrency } from "@/lib/calculations";
import { format } from "date-fns";
import { Plus } from "@phosphor-icons/react";

interface DividendTrackerProps {
  dividends: Dividend[];
}

export function DividendTracker({ dividends }: DividendTrackerProps) {
  const router = useRouter();
  const t = useTranslations("Dividends");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ticker, setTicker] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const sorted = [...dividends].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const total = dividends.reduce((sum, d) => sum + d.amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const amt = parseFloat(amount);
    if (!ticker || !date || isNaN(amt) || amt <= 0) {
      setError(t("errorRequired"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/portfolio/dividend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          ticker: ticker.toUpperCase(),
          amount: amt,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add dividend");
      }

      setTicker("");
      setDate(new Date().toISOString().split("T")[0]);
      setAmount("");
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("title")}</CardTitle>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-emerald-400">
            {t("total", { amount: formatCurrency(total) })}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setShowForm(!showForm)}
            title={t("addTitle")}
          >
            <Plus size={14} weight="bold" />
          </Button>
        </div>
      </CardHeader>
      {showForm && (
        <div className="px-6 pb-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="space-y-1 flex-1">
              <label className="text-xs font-medium">{t("labelTicker")}</label>
              <Input
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="AAPL"
                className="h-8 text-sm"
                required
              />
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-xs font-medium">{t("labelDate")}</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-sm"
                required
              />
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-xs font-medium">{t("labelAmount")}</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="25.00"
                className="h-8 text-sm"
                required
              />
            </div>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? t("adding") : t("add")}
            </Button>
          </form>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
      )}
      <CardContent className="p-0">
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("ticker")}</TableHead>
                <TableHead className="text-right">{t("amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((d, i) => (
                <TableRow key={`${d.ticker}-${d.date}-${i}`} className="hover:bg-accent/50">
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(d.date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/stocks/${d.ticker}`}
                      className="font-medium hover:underline"
                    >
                      {d.ticker}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-emerald-400">
                    {formatCurrency(d.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
