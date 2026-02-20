import fs from "fs";
import path from "path";

export interface AIHistoryEntry {
  id: string;
  type: "advisor" | "analysis" | "discovery" | "dca";
  date: string;
  content: string;
  metadata: Record<string, unknown>;
}

const HISTORY_PATH = path.join(process.cwd(), "data", "ai-history.json");

export function getAIHistory(): AIHistoryEntry[] {
  try {
    const data = fs.readFileSync(HISTORY_PATH, "utf-8");
    return JSON.parse(data) as AIHistoryEntry[];
  } catch {
    return [];
  }
}

export function getAIHistoryByType(type: AIHistoryEntry["type"]): AIHistoryEntry[] {
  return getAIHistory().filter((e) => e.type === type);
}

export function getAIHistoryByTicker(ticker: string): AIHistoryEntry[] {
  return getAIHistory().filter(
    (e) => e.metadata.ticker && String(e.metadata.ticker).toUpperCase() === ticker.toUpperCase()
  );
}

export function addAIHistoryEntry(
  entry: Omit<AIHistoryEntry, "id" | "date">
): AIHistoryEntry {
  const history = getAIHistory();
  const newEntry: AIHistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
  };
  history.unshift(newEntry);

  // Keep max 50 entries to avoid bloat
  if (history.length > 50) {
    history.length = 50;
  }

  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
  return newEntry;
}

export function deleteAIHistoryEntry(id: string): boolean {
  const history = getAIHistory();
  const filtered = history.filter((e) => e.id !== id);
  if (filtered.length === history.length) return false;
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(filtered, null, 2));
  return true;
}
