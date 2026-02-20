"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AIMarkdown } from "@/components/ui/ai-markdown";
import { AIHistory } from "@/components/ui/ai-history";
import { useAIStream } from "@/lib/hooks/use-ai-stream";
import { Brain, ArrowClockwise } from "@phosphor-icons/react";

export function AIAdvisorDialog() {
  const t = useTranslations("AIAdvisor");
  const [open, setOpen] = useState(false);
  const { content, loading, error, generate, reset } = useAIStream({
    url: "/api/ai/advisor",
    save: { type: "advisor" },
  });

  const hasContent = content.length > 0;

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      reset();
    }
  }

  function handleGenerate() {
    generate({});
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Brain size={16} />
          {t("button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain size={20} />
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        {!hasContent && !loading && !error && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm mb-4">
              {t("description")}
            </p>
            <Button onClick={handleGenerate}>
              <Brain size={16} />
              {t("analyze")}
            </Button>
          </div>
        )}

        {loading && !hasContent && (
          <div className="flex items-center gap-3 py-8 justify-center">
            <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm text-muted-foreground">
              {t("analyzing")}
            </span>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-destructive text-sm mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={handleGenerate}>
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

        <AIHistory type="advisor" />
      </DialogContent>
    </Dialog>
  );
}
