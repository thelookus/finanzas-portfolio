"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Question } from "@phosphor-icons/react";

export function OpportunitiesGuideDialog() {
  const t = useTranslations("Guide");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Question size={18} weight="bold" />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm">
          <section>
            <h3 className="font-semibold mb-1">{t("whatStocks")}</h3>
            <p className="text-muted-foreground">
              {t("whatStocksDesc")}
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-1">{t("scoreTitle")}</h3>
            <p className="text-muted-foreground mb-2">
              {t("scoreDesc")}
            </p>
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-3 py-1.5 font-medium">{t("factor")}</th>
                    <th className="text-left px-3 py-1.5 font-medium">{t("condition")}</th>
                    <th className="text-right px-3 py-1.5 font-medium">{t("pts")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr><td className="px-3 py-1.5">{t("rsiBelow30")}</td><td className="px-3 py-1.5">{t("oversold")}</td><td className="px-3 py-1.5 text-right text-emerald-400">+20</td></tr>
                  <tr><td className="px-3 py-1.5">{t("rsiBelow40")}</td><td className="px-3 py-1.5">{t("somewhatLow")}</td><td className="px-3 py-1.5 text-right text-emerald-400">+10</td></tr>
                  <tr><td className="px-3 py-1.5">{t("rsiAbove70")}</td><td className="px-3 py-1.5">{t("overbought")}</td><td className="px-3 py-1.5 text-right text-red-400">−15</td></tr>
                  <tr><td className="px-3 py-1.5">{t("belowSMA200")}</td><td className="px-3 py-1.5">{t("belowLongTrend")}</td><td className="px-3 py-1.5 text-right text-emerald-400">+15</td></tr>
                  <tr><td className="px-3 py-1.5">{t("near52WLow")}</td><td className="px-3 py-1.5">{t("nearFloor")}</td><td className="px-3 py-1.5 text-right text-emerald-400">+15</td></tr>
                  <tr><td className="px-3 py-1.5">{t("analystUpsideRow")}</td><td className="px-3 py-1.5">{t("analystsSeeUpside")}</td><td className="px-3 py-1.5 text-right text-emerald-400">+15</td></tr>
                  <tr><td className="px-3 py-1.5">{t("macdPositive")}</td><td className="px-3 py-1.5">{t("bullishMomentum")}</td><td className="px-3 py-1.5 text-right text-emerald-400">+5</td></tr>
                  <tr><td className="px-3 py-1.5">{t("bollingerLower")}</td><td className="px-3 py-1.5">{t("volatilityFloor")}</td><td className="px-3 py-1.5 text-right text-emerald-400">+10</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-1">{t("scoreColorsTitle")}</h3>
            <div className="space-y-1 text-muted-foreground">
              <p><span className="inline-block w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500/50 mr-1.5 align-middle" /><strong>{t("greenLabel")}</strong> {t("greenDesc")}</p>
              <p><span className="inline-block w-3 h-3 rounded-sm bg-yellow-500/30 border border-yellow-500/50 mr-1.5 align-middle" /><strong>{t("yellowLabel")}</strong> {t("yellowDesc")}</p>
              <p><span className="inline-block w-3 h-3 rounded-sm bg-red-500/30 border border-red-500/50 mr-1.5 align-middle" /><strong>{t("redLabel")}</strong> {t("redDesc")}</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-1">{t("columnsTitle")}</h3>
            <div className="space-y-1.5 text-muted-foreground">
              <p><strong>vs SMA200:</strong> {t("colSMA200")}</p>
              <p><strong>vs 52W Low:</strong> {t("col52WLow")}</p>
              <p><strong>Analyst Upside:</strong> {t("colAnalystUpside")}</p>
              <p><strong>Signals:</strong> {t("colSignals")}</p>
            </div>
          </section>

          <section className="rounded-md bg-muted/50 p-3">
            <p className="text-muted-foreground">
              <strong>{t("summaryLabel")}</strong> {t("summaryText")}
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
