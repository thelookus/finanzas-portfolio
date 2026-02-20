import YahooFinanceModule from "yahoo-finance2";
import { QuoteData, CandleData } from "@/types";

// yahoo-finance2 v3 needs instantiation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const yahooFinance = new (YahooFinanceModule as any)({ suppressNotices: ["yahooSurvey"] });

export async function getQuote(ticker: string): Promise<QuoteData | null> {
  try {
    const result = await yahooFinance.quote(ticker);
    if (!result) return null;

    return {
      ticker,
      price: result.regularMarketPrice ?? 0,
      previousClose: result.regularMarketPreviousClose ?? 0,
      change: result.regularMarketChange ?? 0,
      changePercent: result.regularMarketChangePercent ?? 0,
      dayHigh: result.regularMarketDayHigh ?? 0,
      dayLow: result.regularMarketDayLow ?? 0,
      volume: result.regularMarketVolume ?? 0,
      marketCap: result.marketCap ?? null,
      name: result.shortName ?? result.longName ?? ticker,
      fiftyTwoWeekHigh: result.fiftyTwoWeekHigh ?? 0,
      fiftyTwoWeekLow: result.fiftyTwoWeekLow ?? 0,
      peRatio: result.trailingPE ?? null,
      forwardPE: result.forwardPE ?? null,
      dividendYield: result.dividendYield ?? null,
      averageAnalystRating: result.averageAnalystRating ?? null,
      targetMeanPrice: result.targetMeanPrice ?? null,
      targetHighPrice: result.targetHighPrice ?? null,
      targetLowPrice: result.targetLowPrice ?? null,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${ticker}:`, error);
    return null;
  }
}

export async function getQuotes(
  tickers: string[]
): Promise<Map<string, QuoteData>> {
  const quotes = new Map<string, QuoteData>();
  const results = await Promise.allSettled(tickers.map((t) => getQuote(t)));

  results.forEach((result) => {
    if (result.status === "fulfilled" && result.value) {
      quotes.set(result.value.ticker, result.value);
    }
  });

  return quotes;
}

export async function getChart(
  ticker: string,
  range: string = "6mo"
): Promise<CandleData[]> {
  try {
    const validRanges: Record<string, string> = {
      "1mo": "1d",
      "3mo": "1d",
      "6mo": "1d",
      "1y": "1d",
      "2y": "1wk",
      "5y": "1wk",
    };

    const interval = (validRanges[range] ?? "1d") as "1d" | "1wk";
    const period1 = getPeriod1(range);

    const result = await yahooFinance.chart(ticker, {
      period1,
      interval,
    });

    if (!result?.quotes) return [];

    return result.quotes
      .filter(
        (q: { open: number | null; high: number | null; low: number | null; close: number | null }) =>
          q.open != null &&
          q.high != null &&
          q.low != null &&
          q.close != null
      )
      .map((q: { date: Date; open: number; high: number; low: number; close: number; volume?: number }) => ({
        date: new Date(q.date).toISOString().split("T")[0],
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume ?? 0,
      }));
  } catch (error) {
    console.error(`Error fetching chart for ${ticker}:`, error);
    return [];
  }
}

function getPeriod1(range: string): Date {
  const now = new Date();
  switch (range) {
    case "1mo":
      return new Date(now.setMonth(now.getMonth() - 1));
    case "3mo":
      return new Date(now.setMonth(now.getMonth() - 3));
    case "6mo":
      return new Date(now.setMonth(now.getMonth() - 6));
    case "1y":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case "2y":
      return new Date(now.setFullYear(now.getFullYear() - 2));
    case "5y":
      return new Date(now.setFullYear(now.getFullYear() - 5));
    default:
      return new Date(now.setMonth(now.getMonth() - 6));
  }
}

export async function getQuoteSummary(ticker: string) {
  try {
    const result = await yahooFinance.quoteSummary(ticker, {
      modules: [
        "summaryDetail",
        "financialData",
        "defaultKeyStatistics",
        "earnings",
      ],
    });
    return result;
  } catch (error) {
    console.error(`Error fetching summary for ${ticker}:`, error);
    return null;
  }
}
