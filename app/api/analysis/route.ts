import { NextRequest, NextResponse } from "next/server";
import { getChart, getQuote } from "@/lib/yahoo-finance";
import { computeTechnicalAnalysis } from "@/lib/technical-analysis";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  const range = request.nextUrl.searchParams.get("range") || "6mo";

  if (!ticker) {
    return NextResponse.json({ error: "ticker param required" }, { status: 400 });
  }

  const [candles, quote] = await Promise.all([
    getChart(ticker.toUpperCase(), range),
    getQuote(ticker.toUpperCase()),
  ]);

  const analysis = candles.length > 0
    ? computeTechnicalAnalysis(ticker.toUpperCase(), candles)
    : null;

  return NextResponse.json(
    { candles, analysis, quote },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    }
  );
}
