import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAnthropicClient, AI_MODEL, getSystemPrefix, createStreamingResponse } from "@/lib/ai";
import { getPortfolio } from "@/lib/portfolio";

export async function POST(request: NextRequest) {
  try {
    const store = await cookies();
    const locale = store.get("locale")?.value || "es-AR";
    const isEN = locale === "en";

    const { query } = await request.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: isEN ? "Query required" : "Query requerido" },
        { status: 400 }
      );
    }

    const portfolio = getPortfolio();
    const currentTickers = portfolio.holdings.map((h) => `${h.ticker} (${h.sector})`);

    const prompt = isEN
      ? `The user is looking for investments. They already have these positions: ${currentTickers.join(", ") || "none"}.

Their query: "${query}"

Respond with specific, concrete tickers that match what they're looking for. For each suggestion:

1. Mention the ticker in backticks (e.g., \`VOO\`, \`XLV\`) so it's clickable
2. Briefly explain what it is and why it's relevant to the search
3. Mention if they already have something similar in their portfolio

Rules:
- Prioritize ETFs over individual stocks for a retail investor buying small amounts ($25-$200/month)
- Suggest between 3 and 8 options, ordered from most to least recommended
- If the query doesn't make financial sense, explain why kindly
- Include concrete data when possible (expense ratio for ETFs, dividend yield, etc.)
- At the end, indicate which one you would choose and why

Use markdown format with headers and lists.`
      : `El usuario está buscando inversiones. Ya tiene estas posiciones: ${currentTickers.join(", ") || "ninguna"}.

Su consulta: "${query}"

Respondé con tickers específicos y concretos que se ajusten a lo que busca. Para cada sugerencia:

1. Mencioná el ticker entre backticks (ej: \`VOO\`, \`XLV\`) para que sea clickeable
2. Explicá brevemente qué es y por qué es relevante para la búsqueda
3. Mencioná si ya tiene algo similar en su portfolio

Reglas:
- Priorizá ETFs sobre acciones individuales para un inversor minorista que compra montos chicos ($25-$200/mes)
- Sugerí entre 3 y 8 opciones, ordenadas de más a menos recomendada
- Si la consulta no tiene sentido financiero, explicá por qué amablemente
- Incluí datos concretos cuando sea posible (expense ratio de ETFs, dividend yield, etc.)
- Al final, indicá cuál elegirías vos y por qué

Usá formato markdown con headers y listas.`;

    const client = getAnthropicClient();
    const stream = client.messages.stream({
      model: AI_MODEL,
      max_tokens: 1500,
      system: getSystemPrefix(locale),
      messages: [{ role: "user", content: prompt }],
    });

    return new Response(createStreamingResponse(stream, "discovery"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    console.error("AI discovery error:", error);
    return NextResponse.json(
      { error: "Error in search" },
      { status: 500 }
    );
  }
}
