"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIMarkdown } from "@/components/ui/ai-markdown";
import { AIHistory } from "@/components/ui/ai-history";
import { useAIStream } from "@/lib/hooks/use-ai-stream";
import { Brain, ArrowClockwise } from "@phosphor-icons/react";

interface AIAnalysisCardProps {
  ticker: string;
}

export function AIAnalysisCard({ ticker }: AIAnalysisCardProps) {
  const t = useTranslations("AIAnalysis");
  const { content, loading, error, generate, reset } = useAIStream({
    url: "/api/ai/analysis",
    save: { type: "analysis", metadata: { ticker } },
  });

  const hasContent = content.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain size={20} />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasContent && !loading && !error && (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm mb-4">
              {t("description")}
            </p>
            <Button onClick={() => generate({ ticker })} disabled={loading}>
              <Brain size={16} />
              {t("generate")}
            </Button>
          </div>
        )}

        {loading && !hasContent && (
          <div className="flex items-center gap-3 py-6 justify-center">
            <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm text-muted-foreground">
              {t("analyzing", { ticker })}
            </span>
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <p className="text-destructive text-sm mb-3">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generate({ ticker })}
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
                    generate({ ticker });
                  }}
                >
                  <ArrowClockwise size={14} />
                  {t("regenerate")}
                </Button>
              </div>
            )}
          </div>
        )}

        <AIHistory type="analysis" ticker={ticker} />
      </CardContent>
    </Card>
  );
}
