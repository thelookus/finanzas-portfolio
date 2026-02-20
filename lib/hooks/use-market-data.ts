"use client";

import { useState, useEffect, useCallback } from "react";
import { QuoteData } from "@/types";

function isMarketHours(): boolean {
  const now = new Date();
  const est = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const day = est.getDay();
  const hour = est.getHours();
  const minute = est.getMinutes();
  const time = hour * 60 + minute;
  // Market hours: Mon-Fri, 9:30 AM - 4:00 PM ET
  return day >= 1 && day <= 5 && time >= 570 && time <= 960;
}

export function useMarketData(tickers: string[]) {
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    if (tickers.length === 0) return;
    try {
      const res = await fetch(
        `/api/quotes?tickers=${tickers.join(",")}`
      );
      if (!res.ok) throw new Error("Failed to fetch quotes");
      const data = await res.json();
      setQuotes(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [tickers]);

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(
      fetchQuotes,
      isMarketHours() ? 60_000 : 300_000
    );
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  return { quotes, loading, error, refetch: fetchQuotes };
}
