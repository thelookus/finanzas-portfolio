import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAnthropicClient, AI_MODEL, getSystemPrefix, createStreamingResponse } from "@/lib/ai";
import { getPortfolio } from "@/lib/portfolio";
import { getQuotes } from "@/lib/yahoo-finance";
import { enrichHoldings } from "@/lib/calculations";
import { getChart } from "@/lib/yahoo-finance";
import { computeTechnicalAnalysis } from "@/lib/technical-analysis";
import { scoreOpportunity } from "@/lib/scanner";

export async function POST(request: NextRequest) {
  try {
    const store = await cookies();
    const locale = store.get("locale")?.value || "es-AR";
    const isEN = locale === "en";

    const { budget } = await request.json();
    if (!budget || typeof budget !== "number" || budget < 1) {
      return NextResponse.json(
        { error: isEN ? "Monthly budget required (positive number)" : "Presupuesto mensual requerido (número positivo)" },
        { status: 400 }
      );
    }

    const portfolio = getPortfolio();
    const tickers = portfolio.holdings.map((h) => h.ticker);
    const quotes = await getQuotes(tickers);
    const holdings = enrichHoldings(portfolio.holdings, quotes);

    if (holdings.length === 0) {
      return NextResponse.json(
        { error: isEN ? "No holdings with market data" : "No hay holdings con datos de mercado" },
        { status: 400 }
      );
    }

    // Compute opportunity scores for each holding
    const opportunities = await Promise.all(
      holdings.map(async (h) => {
        try {
          const candles = await getChart(h.ticker, "1y");
          if (candles.length === 0) return null;
          const analysis = computeTechnicalAnalysis(h.ticker, candles);
          const opp = scoreOpportunity(h.quote, analysis);
          return { ticker: h.ticker, score: opp.score, signals: opp.signals };
        } catch {
          return null;
        }
      })
    );

    const holdingsInfo = holdings.map((h) => {
      const opp = opportunities.find((o) => o?.ticker === h.ticker);
      return `- ${h.ticker} (${h.quote.name}): sector ${h.sector}, weight ${h.weight.toFixed(1)}%, price $${h.quote.price.toFixed(2)}, P&L ${h.pnlPercent.toFixed(1)}%, opportunity score: ${opp?.score ?? "N/A"}/100`;
    });

    const sectorMap = new Map<string, number>();
    for (const h of holdings) {
      const existing = sectorMap.get(h.sector) ?? 0;
      sectorMap.set(h.sector, existing + h.weight);
    }
    const sectors = Array.from(sectorMap.entries())
      .map(([sector, weight]) => `- ${sector}: ${weight.toFixed(1)}%`)
      .sort();

    const prompt = isEN
      ? `The user wants to invest $${budget} per month using DCA (Dollar Cost Averaging). Help them distribute that budget.

Current portfolio (${holdings.length} positions, total value $${holdings.reduce((s, h) => s + h.currentValue, 0).toFixed(2)}):
${holdingsInfo.join("\n")}

Sector distribution:
${sectors.join("\n")}

Instructions:
1. Suggest how to distribute the $${budget} monthly
2. Include both current holdings and possible new positions
3. Consider:
   - Opportunity scores (higher score = more technically attractive)
   - Sector diversification (cover missing sectors)
   - Current weights (don't over-concentrate)
   - This is a long-term retirement portfolio
4. Be concrete: "Put $X in \`TICKER\`"
5. If $${budget} is too little for many positions, prioritize 2-3 tickers

Structure:

### Suggested Distribution
Table or list with each ticker and amount.

### Reasoning
Why this distribution.

### New Positions to Consider
If applicable, 1-2 new tickers that would add diversification.

### Note
Remember that with small amounts, it's better to concentrate on fewer positions than to spread too thin.`
      : `El usuario quiere invertir $${budget} por mes usando DCA (Dollar Cost Averaging). Ayudalo a distribuir ese presupuesto.

Portfolio actual (${holdings.length} posiciones, valor total $${holdings.reduce((s, h) => s + h.currentValue, 0).toFixed(2)}):
${holdingsInfo.join("\n")}

Distribución por sector:
${sectors.join("\n")}

Instrucciones:
1. Sugerí cómo distribuir los $${budget} mensuales
2. Incluí tanto holdings actuales como posibles nuevas posiciones
3. Considerá:
   - Opportunity scores (mayor score = más atractivo técnicamente)
   - Diversificación por sector (cubrir sectores faltantes)
   - Pesos actuales (no sobre-concentrar)
   - Que es un portfolio de retiro a largo plazo
4. Sé concreto: "Poné $X en \`TICKER\`"
5. Si $${budget} es poco para muchas posiciones, priorizá 2-3 tickers

Estructura:

### Distribución Sugerida
Tabla o lista con cada ticker y monto.

### Razonamiento
Por qué esta distribución.

### Nuevas Posiciones a Considerar
Si aplica, 1-2 tickers nuevos que agregarían diversificación.

### Nota
Recordá que con montos chicos, es mejor concentrar en menos posiciones que atomizar demasiado.`;

    const client = getAnthropicClient();
    const stream = client.messages.stream({
      model: AI_MODEL,
      max_tokens: 1500,
      system: getSystemPrefix(locale),
      messages: [{ role: "user", content: prompt }],
    });

    return new Response(createStreamingResponse(stream, "dca"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("AI DCA error:", error);
    return NextResponse.json(
      { error: "Error generating DCA plan" },
      { status: 500 }
    );
  }
}
