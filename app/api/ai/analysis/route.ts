import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAnthropicClient, AI_MODEL, getSystemPrefix, createStreamingResponse } from "@/lib/ai";
import { getQuote, getQuoteSummary, getChart } from "@/lib/yahoo-finance";
import { getHolding } from "@/lib/portfolio";
import { computeTechnicalAnalysis } from "@/lib/technical-analysis";
import { scoreOpportunity } from "@/lib/scanner";
import { getAvgCost, getPnL } from "@/lib/calculations";

export async function POST(request: NextRequest) {
  try {
    const store = await cookies();
    const locale = store.get("locale")?.value || "es-AR";
    const isEN = locale === "en";

    const { ticker } = await request.json();
    if (!ticker) {
      return NextResponse.json(
        { error: isEN ? "Ticker required" : "Ticker requerido" },
        { status: 400 }
      );
    }

    const [quote, summary, candles, holding] = await Promise.all([
      getQuote(ticker),
      getQuoteSummary(ticker),
      getChart(ticker, "1y"),
      Promise.resolve(getHolding(ticker)),
    ]);

    if (!quote) {
      return NextResponse.json(
        { error: isEN ? `No data found for ${ticker}` : `No se encontraron datos para ${ticker}` },
        { status: 404 }
      );
    }

    const analysis = candles.length > 0 ? computeTechnicalAnalysis(ticker, candles) : null;
    const opportunity = analysis ? scoreOpportunity(quote, analysis) : null;

    // Build context for Claude
    let positionInfo = isEN
      ? "The user does NOT have a position in this stock."
      : "El usuario NO tiene posición en esta acción.";
    if (holding) {
      const avgCost = getAvgCost(holding);
      const { pnl, pnlPercent } = getPnL(holding, quote.price);
      positionInfo = isEN
        ? `The user has ${holding.totalShares.toFixed(6)} shares, avg cost $${avgCost.toFixed(2)}, invested $${holding.totalInvested.toFixed(2)}, P&L: $${pnl.toFixed(2)} (${pnlPercent.toFixed(1)}%). Sector: ${holding.sector}.`
        : `El usuario tiene ${holding.totalShares.toFixed(6)} acciones, costo promedio $${avgCost.toFixed(2)}, invertido $${holding.totalInvested.toFixed(2)}, P&L: $${pnl.toFixed(2)} (${pnlPercent.toFixed(1)}%). Sector: ${holding.sector}.`;
    }

    // Extract fundamental data from summary
    const financialData = summary?.financialData;
    const keyStats = summary?.defaultKeyStatistics;
    const summaryDetail = summary?.summaryDetail;

    const fundamentals = `
Fundamentals:
- Price: $${quote.price.toFixed(2)}
- Market Cap: ${quote.marketCap ? `$${(quote.marketCap / 1e9).toFixed(2)}B` : "N/A"}
- P/E Trailing: ${quote.peRatio?.toFixed(2) ?? "N/A"}
- P/E Forward: ${quote.forwardPE?.toFixed(2) ?? "N/A"}
- Dividend Yield: ${quote.dividendYield ? `${(quote.dividendYield * 100).toFixed(2)}%` : "N/A"}
- 52W High: $${quote.fiftyTwoWeekHigh.toFixed(2)} | Low: $${quote.fiftyTwoWeekLow.toFixed(2)}
- Analyst Rating: ${quote.averageAnalystRating ?? "N/A"}
- Target Price: Mean $${quote.targetMeanPrice?.toFixed(2) ?? "N/A"} | High $${quote.targetHighPrice?.toFixed(2) ?? "N/A"} | Low $${quote.targetLowPrice?.toFixed(2) ?? "N/A"}
${financialData ? `- Revenue Growth: ${financialData.revenueGrowth ? `${(financialData.revenueGrowth * 100).toFixed(1)}%` : "N/A"}
- Profit Margins: ${financialData.profitMargins ? `${(financialData.profitMargins * 100).toFixed(1)}%` : "N/A"}
- Return on Equity: ${financialData.returnOnEquity ? `${(financialData.returnOnEquity * 100).toFixed(1)}%` : "N/A"}
- Debt to Equity: ${financialData.debtToEquity?.toFixed(1) ?? "N/A"}
- Current Ratio: ${financialData.currentRatio?.toFixed(2) ?? "N/A"}
- Free Cash Flow: ${financialData.freeCashflow ? `$${(financialData.freeCashflow / 1e9).toFixed(2)}B` : "N/A"}` : ""}
${keyStats ? `- Beta: ${keyStats.beta?.toFixed(2) ?? "N/A"}
- PEG Ratio: ${keyStats.pegRatio?.toFixed(2) ?? "N/A"}` : ""}
${summaryDetail ? `- Ex-Dividend Date: ${summaryDetail.exDividendDate ?? "N/A"}
- Payout Ratio: ${summaryDetail.payoutRatio ? `${(summaryDetail.payoutRatio * 100).toFixed(1)}%` : "N/A"}` : ""}`;

    const technicalInfo = analysis
      ? `
Technical Analysis:
- RSI(14): ${analysis.rsi14?.toFixed(1) ?? "N/A"}
- SMA(20): $${analysis.sma20?.toFixed(2) ?? "N/A"}
- SMA(50): $${analysis.sma50?.toFixed(2) ?? "N/A"}
- SMA(200): $${analysis.sma200?.toFixed(2) ?? "N/A"}
- MACD: ${analysis.macd ? `${analysis.macd.macd.toFixed(3)} (signal: ${analysis.macd.signal.toFixed(3)}, histogram: ${analysis.macd.histogram.toFixed(3)})` : "N/A"}
- Bollinger: ${analysis.bollingerBands ? `Upper $${analysis.bollingerBands.upper.toFixed(2)} / Middle $${analysis.bollingerBands.middle.toFixed(2)} / Lower $${analysis.bollingerBands.lower.toFixed(2)}` : "N/A"}
- Signals: ${analysis.signals.map((s) => `${s.type.toUpperCase()}: ${s.message}`).join(", ") || "None"}
- Opportunity Score: ${opportunity?.score ?? "N/A"}/100`
      : isEN ? "Technical analysis not available (insufficient data)." : "Análisis técnico no disponible (datos insuficientes).";

    const prompt = isEN
      ? `Analyze the stock **${ticker}** (${quote.name}) for a retail investor building a long-term retirement portfolio, buying small amounts.

${positionInfo}

${fundamentals}

${technicalInfo}

Structure your response like this:
### Summary
A short paragraph explaining what this company is and its current situation in simple language.

### Fundamental Analysis
Evaluate key numbers: valuation (P/E, PEG), financial health (debt, cash flow), growth, dividends if applicable.

### Technical Analysis
Explain the current technical situation in simple language: trend, momentum, key levels.

### Verdict
One of: **Buy more** / **Hold** / **Wait**
With a brief explanation of why.

### Risk Level
Low / Medium / High — with context.`
      : `Analizá la acción **${ticker}** (${quote.name}) para un inversor minorista que está armando un portfolio de retiro a largo plazo comprando de a poco.

${positionInfo}

${fundamentals}

${technicalInfo}

Estructura tu respuesta así:
### Resumen
Un párrafo corto explicando qué es esta empresa y su situación actual en lenguaje simple.

### Análisis Fundamental
Evaluá los números clave: valuación (P/E, PEG), salud financiera (deuda, cash flow), crecimiento, dividendos si aplica.

### Análisis Técnico
Explicá la situación técnica actual en lenguaje simple: tendencia, momentum, niveles clave.

### Veredicto
Uno de: **Comprar más** / **Mantener** / **Esperar**
Con una explicación breve del porqué.

### Nivel de Riesgo
Bajo / Medio / Alto — con contexto.`;

    const client = getAnthropicClient();
    const stream = client.messages.stream({
      model: AI_MODEL,
      max_tokens: 1500,
      system: getSystemPrefix(locale),
      messages: [{ role: "user", content: prompt }],
    });

    return new Response(createStreamingResponse(stream, "analysis"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json(
      { error: "Error generating analysis" },
      { status: 500 }
    );
  }
}
