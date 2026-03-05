"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Transaction } from "@/types";

interface TransactionEditFormProps {
  transaction: Transaction & { holdingIndex: number };
  existingTickers: string[];
  onClose: () => void;
}

export function TransactionEditForm({
  transaction,
  existingTickers,
  onClose,
}: TransactionEditFormProps) {
  const router = useRouter();
  const t = useTranslations("Transaction");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [ticker, setTicker] = useState(transaction.ticker);
  const [date, setDate] = useState(transaction.date);
  const [shares, setShares] = useState(String(transaction.shares));
  const [pricePerShare, setPricePerShare] = useState(String(transaction.pricePerShare));
  const [sector, setSector] = useState("");

  const costUsd = (() => {
    const s = parseFloat(shares);
    const p = parseFloat(pricePerShare);
    if (s > 0 && p > 0) return s * p;
    return 0;
  })();

  const tickerChanged = ticker.toUpperCase() !== transaction.ticker.toUpperCase();
  const isNewTicker = tickerChanged && !existingTickers.includes(ticker.toUpperCase());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const qty = parseFloat(shares);
    const pps = parseFloat(pricePerShare);

    if (!ticker || !date || isNaN(qty) || isNaN(pps)) {
      setError(t("errorRequired"));
      return;
    }
    if (qty <= 0 || pps <= 0) {
      setError(t("errorPositive"));
      return;
    }
    if (isNewTicker && !sector.trim()) {
      setError(t("errorSectorRequired"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: transaction.ticker,
          index: transaction.holdingIndex,
          update: {
            ticker: ticker.toUpperCase(),
            date,
            shares: qty,
            pricePerShare: pps,
            costUsd: qty * pps,
            ...(isNewTicker ? { sector: sector.trim() } : {}),
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update transaction");
      }

      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("labelTicker")}</label>
          <Input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="AAPL"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("labelDate")}</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("labelShares")}</label>
          <Input
            type="number"
            step="0.000000001"
            min="0.000000001"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="10"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("labelPricePerShare")}</label>
          <Input
            type="number"
            step="0.0001"
            min="0.0001"
            value={pricePerShare}
            onChange={(e) => setPricePerShare(e.target.value)}
            placeholder="100.00"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t("labelCost")}</label>
        <Input
          type="number"
          value={costUsd.toFixed(2)}
          readOnly
          className="opacity-60"
        />
      </div>

      {isNewTicker && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t("labelSector")}</label>
          <Input
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder={t("placeholderSector")}
            required
          />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("updating") : t("updateTransaction")}
      </Button>
    </form>
  );
}
