"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus } from "@phosphor-icons/react";

interface AddTransactionDialogProps {
  existingTickers: string[];
}

export function AddTransactionDialog({ existingTickers }: AddTransactionDialogProps) {
  const router = useRouter();
  const t = useTranslations("Transaction");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [ticker, setTicker] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [costUsd, setCostUsd] = useState("");
  const [shares, setShares] = useState("");
  const [pricePerShare, setPricePerShare] = useState("");
  const [sector, setSector] = useState("");
  const [autoPrice, setAutoPrice] = useState(true);

  const isNewTicker = ticker.length > 0 && !existingTickers.includes(ticker.toUpperCase());

  function handleCostOrSharesChange(newCost: string, newShares: string) {
    setCostUsd(newCost);
    setShares(newShares);
    if (autoPrice && newCost && newShares) {
      const c = parseFloat(newCost);
      const s = parseFloat(newShares);
      if (c > 0 && s > 0) {
        setPricePerShare((c / s).toFixed(4));
      }
    }
  }

  function resetForm() {
    setTicker("");
    setDate(new Date().toISOString().split("T")[0]);
    setCostUsd("");
    setShares("");
    setPricePerShare("");
    setSector("");
    setAutoPrice(true);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cost = parseFloat(costUsd);
    const qty = parseFloat(shares);
    const pps = parseFloat(pricePerShare);

    if (!ticker || !date || isNaN(cost) || isNaN(qty) || isNaN(pps)) {
      setError(t("errorRequired"));
      return;
    }
    if (cost <= 0 || qty <= 0 || pps <= 0) {
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: ticker.toUpperCase(),
          date,
          costUsd: cost,
          shares: qty,
          pricePerShare: pps,
          ...(isNewTicker ? { sector: sector.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add transaction");
      }

      resetForm();
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus size={16} weight="bold" />
          {t("addButton")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addTitle")}</DialogTitle>
          <DialogDescription>{t("addDescription")}</DialogDescription>
        </DialogHeader>
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
              <label className="text-sm font-medium">{t("labelCost")}</label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={costUsd}
                onChange={(e) => handleCostOrSharesChange(e.target.value, shares)}
                placeholder="1000.00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("labelShares")}</label>
              <Input
                type="number"
                step="0.000000001"
                min="0.000000001"
                value={shares}
                onChange={(e) => handleCostOrSharesChange(costUsd, e.target.value)}
                placeholder="10"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t("labelPricePerShare")}
              <button
                type="button"
                onClick={() => setAutoPrice(!autoPrice)}
                className="ml-2 text-xs text-muted-foreground hover:text-foreground"
              >
                ({autoPrice ? t("autoMode") : t("manualMode")})
              </button>
            </label>
            <Input
              type="number"
              step="0.0001"
              min="0.0001"
              value={pricePerShare}
              onChange={(e) => {
                setAutoPrice(false);
                setPricePerShare(e.target.value);
              }}
              placeholder="100.00"
              readOnly={autoPrice}
              className={autoPrice ? "opacity-60" : ""}
              required
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

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("adding") : t("addButton")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
