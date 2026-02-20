import Anthropic from "@anthropic-ai/sdk";
import { trackUsage } from "@/lib/ai-usage";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

export const AI_MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PREFIX_ES = `Sos un asesor financiero personal experto. Hablás en español rioplatense (argentino), de manera clara, directa y amigable. Usás "vos" en vez de "tú".

Reglas importantes:
- Siempre aclarás que no sos asesor financiero certificado y que tus sugerencias son educativas
- Usás datos concretos cuando los tenés disponibles (precios, ratios, porcentajes)
- Explicás conceptos técnicos en lenguaje simple
- Sos conciso pero completo
- Usás formato markdown para estructurar las respuestas (headers, listas, bold)
- Cuando mencionás tickers, los ponés en **bold** o \`code\``;

const SYSTEM_PREFIX_EN = `You are an expert personal financial advisor. You speak in clear, direct, and friendly English.

Important rules:
- Always clarify that you are not a certified financial advisor and your suggestions are educational
- Use concrete data when available (prices, ratios, percentages)
- Explain technical concepts in simple language
- Be concise but thorough
- Use markdown formatting to structure responses (headers, lists, bold)
- When mentioning tickers, put them in **bold** or \`code\``;

export function getSystemPrefix(locale: string): string {
  return locale === "en" ? SYSTEM_PREFIX_EN : SYSTEM_PREFIX_ES;
}

// Keep backward compat export for any other usage
export const SYSTEM_PREFIX = SYSTEM_PREFIX_ES;

export function createStreamingResponse(
  stream: AsyncIterable<Anthropic.MessageStreamEvent>,
  feature?: string
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      let inputTokens = 0;
      let outputTokens = 0;

      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }

          // Capture usage from stream events
          if (event.type === "message_start" && event.message?.usage) {
            inputTokens = event.message.usage.input_tokens;
          }
          if (event.type === "message_delta" && event.usage) {
            outputTokens = event.usage.output_tokens;
          }
        }

        // Track usage after stream completes
        if (inputTokens > 0 || outputTokens > 0) {
          trackUsage({
            model: AI_MODEL,
            inputTokens,
            outputTokens,
            feature: feature ?? "unknown",
          });
        }

        controller.close();
      } catch (error) {
        console.error("Streaming error:", error);
        controller.error(error);
      }
    },
  });
}
