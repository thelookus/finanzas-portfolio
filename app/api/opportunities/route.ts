import { NextResponse } from "next/server";
import { getPortfolio, getWatchlist } from "@/lib/portfolio";
import { getQuotes, getChart } from "@/lib/yahoo-finance";
import { computeTechnicalAnalysis } from "@/lib/technical-analysis";
import { scoreOpportunity } from "@/lib/scanner";

export async function GET() {
  try {
    const portfolio = getPortfolio();
    const watchlist = getWatchlist();

    const allTickers = [
      ...new Set([
        ...portfolio.holdings.map((h) => h.ticker),
        ...watchlist.map((w) => w.ticker),
      ]),
    ];

    const quotes = await getQuotes(allTickers);

    const chartsResults = await Promise.allSettled(
      allTickers.map(async (ticker) => {
        const candles = await getChart(ticker, "1y");
        return { ticker, candles };
      })
    );

    let hotCount = 0;

    for (const result of chartsResults) {
      if (result.status !== "fulfilled") continue;
      const { ticker, candles } = result.value;
      const quote = quotes.get(ticker);
      if (!quote || candles.length === 0) continue;

      const analysis = computeTechnicalAnalysis(ticker, candles);
      const opportunity = scoreOpportunity(quote, analysis);
      if (opportunity.score >= 70) hotCount++;
    }

    return NextResponse.json({ hotCount });
  } catch {
    return NextResponse.json({ hotCount: 0 });
  }
}
