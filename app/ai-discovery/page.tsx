"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIMarkdown } from "@/components/ui/ai-markdown";
import { AIHistory } from "@/components/ui/ai-history";
import { useAIStream } from "@/lib/hooks/use-ai-stream";
import { MagnifyingGlass, Sparkle, PaperPlaneTilt } from "@phosphor-icons/react";

const PRESET_KEYS = [
  "presetHealthcare",
  "presetDividends",
  "presetSemiconductors",
  "presetEmerging",
  "presetREITs",
  "presetBonds",
  "presetRenewable",
  "presetGrowthValue",
] as const;

export default function DiscoveryPage() {
  const t = useTranslations("Discovery");
  const [query, setQuery] = useState("");
  const { content, loading, error, generate, reset } = useAIStream({
    url: "/api/ai/discovery",
    save: { type: "discovery" },
  });

  const hasContent = content.length > 0;

  function handleSubmit(searchQuery?: string) {
    const q = searchQuery || query;
    if (!q.trim()) return;
    reset();
    generate({ query: q.trim() });
  }

  function handlePreset(presetKey: string) {
    const presetText = t(presetKey);
    setQuery(presetText);
    handleSubmit(presetText);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkle size={24} />
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("placeholder")}
                className="pl-9"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading || !query.trim()}>
              <PaperPlaneTilt size={16} />
            </Button>
          </form>

          {/* Presets */}
          <div className="flex flex-wrap gap-2 mt-4">
            {PRESET_KEYS.map((key) => (
              <Button
                key={key}
                variant="outline"
                size="xs"
                onClick={() => handlePreset(key)}
                disabled={loading}
                className="text-xs"
              >
                {t(key)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {(hasContent || loading || error) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("results")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !hasContent && (
              <div className="flex items-center gap-3 py-6 justify-center">
                <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-sm text-muted-foreground">
                  {t("searching")}
                </span>
              </div>
            )}

            {error && (
              <div className="text-center py-6">
                <p className="text-destructive text-sm mb-3">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSubmit()}
                >
                  {t("retry")}
                </Button>
              </div>
            )}

            {hasContent && <AIMarkdown content={content} />}
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardContent className="pt-6">
          <AIHistory type="discovery" />
        </CardContent>
      </Card>
    </div>
  );
}
