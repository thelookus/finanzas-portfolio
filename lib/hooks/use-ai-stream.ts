"use client";

import { useState, useCallback, useRef } from "react";

interface SaveConfig {
  type: "advisor" | "analysis" | "discovery" | "dca";
  metadata?: Record<string, unknown>;
}

interface UseAIStreamOptions {
  url: string;
  save?: SaveConfig;
}

interface UseAIStreamReturn {
  content: string;
  loading: boolean;
  error: string | null;
  generate: (body: Record<string, unknown>) => Promise<void>;
  reset: () => void;
}

export function useAIStream({ url, save }: UseAIStreamOptions): UseAIStreamReturn {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setContent("");
    setLoading(false);
    setError(null);
  }, []);

  const generate = useCallback(
    async (body: Record<string, unknown>) => {
      reset();
      setLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            errorData?.error || `Error ${response.status}: ${response.statusText}`
          );
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          accumulated += decoder.decode(value, { stream: true });
          setContent(accumulated);
        }

        // Auto-save on successful completion
        if (save && accumulated.length > 0) {
          fetch("/api/ai/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: save.type,
              content: accumulated,
              metadata: { ...save.metadata, ...body },
            }),
          }).catch((err) => console.error("Error saving AI history:", err));
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Error desconocido");
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [url, reset, save]
  );

  return { content, loading, error, generate, reset };
}
