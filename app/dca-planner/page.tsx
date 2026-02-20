"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIMarkdown } from "@/components/ui/ai-markdown";
import { AIHistory } from "@/components/ui/ai-history";
import { useAIStream } from "@/lib/hooks/use-ai-stream";
import { CalendarDots, ArrowClockwise, CurrencyDollar } from "@phosphor-icons/react";

const BUDGET_PRESETS = [25, 50, 75, 100, 150, 200];

export default function DCAPage() {
  const t = useTranslations("DCA");
  const [budget, setBudget] = useState<string>("100");
  const { content, loading, error, generate, reset } = useAIStream({
    url: "/api/ai/dca",
    save: { type: "dca" },
  });

  const hasContent = content.length > 0;
  const budgetNum = parseFloat(budget);
  const isValid = !isNaN(budgetNum) && budgetNum >= 1;

  function handleGenerate(amount?: number) {
    const b = amount ?? budgetNum;
    if (!b || b < 1) return;
    reset();
    generate({ budget: b });
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDots size={24} />
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Budget Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("budget")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <CurrencyDollar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="number"
                min="1"
                max="10000"
                step="1"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="100"
                className="pl-9"
                disabled={loading}
              />
            </div>
            <Button
              onClick={() => handleGenerate()}
              disabled={loading || !isValid}
            >
              {t("generate")}
            </Button>
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            {BUDGET_PRESETS.map((preset) => (
              <Button
                key={preset}
                variant={budget === String(preset) ? "default" : "outline"}
                size="xs"
                onClick={() => {
                  setBudget(String(preset));
                  handleGenerate(preset);
                }}
                disabled={loading}
              >
                ${preset}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {(hasContent || loading || error) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("planFor", { budget: budgetNum })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !hasContent && (
              <div className="flex items-center gap-3 py-6 justify-center">
                <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-sm text-muted-foreground">
                  {t("calculating")}
                </span>
              </div>
            )}

            {error && (
              <div className="text-center py-6">
                <p className="text-destructive text-sm mb-3">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerate()}
                >
                  {t("retry")}
                </Button>
              </div>
            )}

            {hasContent && (
              <div>
                <AIMarkdown content={content} />
                {!loading && (
                  <div className="mt-4 pt-4 border-t border-border flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        reset();
                        handleGenerate();
                      }}
                    >
                      <ArrowClockwise size={14} />
                      {t("regenerate")}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardContent className="pt-6">
          <AIHistory type="dca" />
        </CardContent>
      </Card>
    </div>
  );
}
