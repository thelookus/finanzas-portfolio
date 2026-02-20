import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAnthropicClient, AI_MODEL, getSystemPrefix, createStreamingResponse } from "@/lib/ai";
import { getPortfolio } from "@/lib/portfolio";
import { getQuotes } from "@/lib/yahoo-finance";
import { enrichHoldings } from "@/lib/calculations";
import type { PortfolioContext } from "@/types";

function buildPortfolioContext(
  holdings: ReturnType<typeof enrichHoldings>,
  totalInvested: number,
  totalDividends: number
): PortfolioContext {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPnL = totalValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // Aggregate sectors
  const sectorMap = new Map<string, number>();
  for (const h of holdings) {
    const existing = sectorMap.get(h.sector) ?? 0;
    sectorMap.set(h.sector, existing + h.weight);
  }
  const sectors = Array.from(sectorMap.entries())
    .map(([sector, weight]) => ({ sector, weight }))
    .sort((a, b) => b.weight - a.weight);

  return {
    holdings: holdings.map((h) => ({
      ticker: h.ticker,
      name: h.quote.name,
      sector: h.sector,
      shares: h.totalShares,
      avgCost: h.avgCost,
      currentPrice: h.quote.price,
      value: h.currentValue,
      weight: h.weight,
      pnl: h.pnl,
      pnlPercent: h.pnlPercent,
    })),
    totalValue,
    totalInvested,
    totalPnL,
    totalPnLPercent,
    sectors,
  };
}

const PROMPT_ES = (portfolioSummary: string) => `Analizá mi portfolio completo y dame consejos como asesor. El usuario es un inversor minorista argentino que está armando un portfolio de retiro a largo plazo, comprando de a poco ($25-$200 por mes).

${portfolioSummary}

Estructura tu respuesta así:

### Score de Diversificación
Dale un puntaje de 1-10 a la diversificación y explicá por qué.

### Riesgos de Concentración
Identificá si hay demasiado peso en algún sector, acción individual, o tipo de activo.

### Sectores Faltantes
Mencioná sectores importantes que NO están representados (ej: healthcare, utilities, consumer staples, real estate, etc.) y por qué importan para un portfolio de retiro.

### Fortalezas del Portfolio
Qué está bien armado.

### Próximas Compras Sugeridas
Sugerí 3-5 tickers concretos que mejorarían la diversificación, con el razonamiento. Priorizá ETFs para un inversor que compra montos chicos.

### Plan de Acción
Qué haría yo en los próximos 2-3 meses con un presupuesto mensual de ~$100.`;

const PROMPT_EN = (portfolioSummary: string) => `Analyze my complete portfolio and give me advice as an advisor. The user is a retail investor building a long-term retirement portfolio, buying small amounts ($25-$200 per month).

${portfolioSummary}

Structure your response like this:

### Diversification Score
Give a score of 1-10 for diversification and explain why.

### Concentration Risks
Identify if there's too much weight in any sector, individual stock, or asset type.

### Missing Sectors
Mention important sectors that are NOT represented (e.g., healthcare, utilities, consumer staples, real estate, etc.) and why they matter for a retirement portfolio.

### Portfolio Strengths
What's well structured.

### Suggested Next Purchases
Suggest 3-5 specific tickers that would improve diversification, with reasoning. Prioritize ETFs for an investor buying small amounts.

### Action Plan
What I would do in the next 2-3 months with a monthly budget of ~$100.`;

export async function POST() {
  try {
    const store = await cookies();
    const locale = store.get("locale")?.value || "es-AR";

    const portfolio = getPortfolio();
    const tickers = portfolio.holdings.map((h) => h.ticker);
    const quotes = await getQuotes(tickers);
    const holdings = enrichHoldings(portfolio.holdings, quotes);
    const totalDividends = portfolio.dividends.reduce((sum, d) => sum + d.amount, 0);

    if (holdings.length === 0) {
      return NextResponse.json(
        { error: locale === "en" ? "No holdings with market data" : "No hay holdings con datos de mercado" },
        { status: 400 }
      );
    }

    const ctx = buildPortfolioContext(holdings, portfolio.totalInvested, totalDividends);

    const portfolioSummary = `
Portfolio (total invested: $${ctx.totalInvested.toFixed(2)}, current value: $${ctx.totalValue.toFixed(2)}, P&L: $${ctx.totalPnL.toFixed(2)} (${ctx.totalPnLPercent.toFixed(1)}%), dividends: $${totalDividends.toFixed(2)}):

Holdings (${ctx.holdings.length} positions):
${ctx.holdings.map((h) => `- ${h.ticker} (${h.name}): ${h.shares.toFixed(4)} shares, sector: ${h.sector}, weight: ${h.weight.toFixed(1)}%, price: $${h.currentPrice.toFixed(2)}, avg cost: $${h.avgCost.toFixed(2)}, value: $${h.value.toFixed(2)}, P&L: $${h.pnl.toFixed(2)} (${h.pnlPercent.toFixed(1)}%)`).join("\n")}

Sector distribution:
${ctx.sectors.map((s) => `- ${s.sector}: ${s.weight.toFixed(1)}%`).join("\n")}`;

    const prompt = locale === "en"
      ? PROMPT_EN(portfolioSummary)
      : PROMPT_ES(portfolioSummary);

    const client = getAnthropicClient();
    const stream = client.messages.stream({
      model: AI_MODEL,
      max_tokens: 2000,
      system: getSystemPrefix(locale),
      messages: [{ role: "user", content: prompt }],
    });

    return new Response(createStreamingResponse(stream, "advisor"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("AI advisor error:", error);
    return NextResponse.json(
      { error: "Error generating portfolio analysis" },
      { status: 500 }
    );
  }
}
