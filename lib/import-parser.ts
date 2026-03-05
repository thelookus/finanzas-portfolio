import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export type DocumentType = "credit_card" | "bank_statement" | "invoice" | "service_bill";
export type AccountType = "checking" | "savings" | "credit" | "cash";

export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  suggestedCategory?: string;
  payee?: string;
}

export interface ImportAnalysis {
  documentType: DocumentType;
  suggestedAccountType: AccountType;
  transactions: ParsedTransaction[];
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const pdf = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await pdf.getText();
  return result.text;
}

export function parseCSV(text: string): ParsedTransaction[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const hasHeader = header.includes("fecha") || header.includes("date") || header.includes("description");
  const startIdx = hasHeader ? 1 : 0;

  const results: ParsedTransaction[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 3) continue;

    const date = cols[0];
    const description = cols[1];
    const rawAmount = parseFloat(cols[2].replace(/[^0-9.-]/g, ""));
    if (isNaN(rawAmount)) continue;

    results.push({
      date,
      description,
      amount: Math.abs(rawAmount),
      type: rawAmount < 0 ? "expense" : "income",
      payee: description,
    });
  }

  return results;
}

export async function analyzeDocument(text: string, categoryNames: string[]): Promise<ImportAnalysis> {
  const categoriesList = categoryNames.length > 0
    ? `\nCategorías disponibles del usuario: ${categoryNames.join(", ")}\nUsá EXACTAMENTE estos nombres cuando aplique.`
    : "";

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 16384,
    messages: [
      {
        role: "user",
        content: `Analizá el siguiente documento financiero y devolvé un JSON con esta estructura:
{
  "documentType": "credit_card" | "bank_statement" | "invoice" | "service_bill",
  "suggestedAccountType": "checking" | "savings" | "credit" | "cash",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "descripción de la transacción",
      "amount": 1234.56,
      "type": "income" | "expense",
      "suggestedCategory": "nombre de categoría",
      "payee": "nombre del comercio o pagador"
    }
  ]
}

Reglas:
- documentType: clasificá el documento según su contenido
  - "credit_card": resumen de tarjeta de crédito
  - "bank_statement": extracto bancario
  - "invoice": factura
  - "service_bill": boleta de servicio (luz, gas, internet, etc.)
- suggestedAccountType: tipo de cuenta más apropiado para estas transacciones
- amount: siempre positivo
- type: "expense" para compras/pagos/cargos, "income" para depósitos/créditos/devoluciones
- suggestedCategory: categoría más apropiada para cada transacción${categoriesList}

Devolvé SOLO el JSON, sin explicaciones ni markdown.

Texto del documento:
${text.substring(0, 8000)}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    console.error("[import-parser] Non-text content type received:", content.type);
    return { documentType: "bank_statement", suggestedAccountType: "checking", transactions: [] };
  }

  const fallback: ImportAnalysis = { documentType: "bank_statement", suggestedAccountType: "checking", transactions: [] };

  // Strategy 1: Try parsing as full object
  try {
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as ImportAnalysis;
      if (parsed.transactions && Array.isArray(parsed.transactions)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("[import-parser] Full object parse failed:", (e as Error).message);
  }

  // Strategy 2: Try parsing as array
  try {
    const arrayMatch = content.text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      const transactions = JSON.parse(arrayMatch[0]) as ParsedTransaction[];
      if (transactions.length > 0) {
        return { ...fallback, transactions };
      }
    }
  } catch (e) {
    console.warn("[import-parser] Array parse failed:", (e as Error).message);
  }

  // Strategy 3: Recover truncated JSON — find last complete transaction object
  try {
    const txArrayStart = content.text.indexOf('"transactions"');
    if (txArrayStart !== -1) {
      const bracketStart = content.text.indexOf("[", txArrayStart);
      if (bracketStart !== -1) {
        const lastCompleteObj = content.text.lastIndexOf("}");
        if (lastCompleteObj > bracketStart) {
          const repaired = content.text.substring(0, lastCompleteObj + 1) + "]}";
          const objStart = repaired.indexOf("{");
          if (objStart !== -1) {
            const parsed = JSON.parse(repaired.substring(objStart)) as ImportAnalysis;
            if (parsed.transactions && Array.isArray(parsed.transactions)) {
              console.warn(`[import-parser] Recovered ${parsed.transactions.length} transactions from truncated response`);
              return parsed;
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn("[import-parser] Truncated JSON recovery failed:", (e as Error).message);
  }

  console.error("[import-parser] All parse strategies failed. Response preview:", content.text.substring(0, 300));
  return fallback;
}
