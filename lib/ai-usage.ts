import fs from "fs";
import path from "path";

// Pricing per million tokens (USD) — Claude Sonnet 4
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-20250514": { input: 3, output: 15 },
};

const DEFAULT_PRICING = { input: 3, output: 15 };

export interface UsageEntry {
  date: string;
  model: string;
  feature: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface UsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  totalRequests: number;
  byFeature: Record<string, { requests: number; inputTokens: number; outputTokens: number; costUsd: number }>;
  byDate: Record<string, { requests: number; costUsd: number }>;
  recentEntries: UsageEntry[];
}

const USAGE_PATH = path.join(process.cwd(), "data", "ai-usage.json");

function getUsageEntries(): UsageEntry[] {
  try {
    const data = fs.readFileSync(USAGE_PATH, "utf-8");
    return JSON.parse(data) as UsageEntry[];
  } catch {
    return [];
  }
}

function saveUsageEntries(entries: UsageEntry[]): void {
  fs.writeFileSync(USAGE_PATH, JSON.stringify(entries, null, 2));
}

export function trackUsage(params: {
  model: string;
  inputTokens: number;
  outputTokens: number;
  feature: string;
}): void {
  const pricing = PRICING[params.model] ?? DEFAULT_PRICING;
  const costUsd =
    (params.inputTokens * pricing.input) / 1_000_000 +
    (params.outputTokens * pricing.output) / 1_000_000;

  const entry: UsageEntry = {
    date: new Date().toISOString(),
    model: params.model,
    feature: params.feature,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    costUsd,
  };

  const entries = getUsageEntries();
  entries.push(entry);

  // Keep max 500 entries
  if (entries.length > 500) {
    entries.splice(0, entries.length - 500);
  }

  saveUsageEntries(entries);
}

export function getUsageSummary(): UsageSummary {
  const entries = getUsageEntries();

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCostUsd = 0;
  const byFeature: UsageSummary["byFeature"] = {};
  const byDate: UsageSummary["byDate"] = {};

  for (const entry of entries) {
    totalInputTokens += entry.inputTokens;
    totalOutputTokens += entry.outputTokens;
    totalCostUsd += entry.costUsd;

    // By feature
    if (!byFeature[entry.feature]) {
      byFeature[entry.feature] = { requests: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };
    }
    byFeature[entry.feature].requests++;
    byFeature[entry.feature].inputTokens += entry.inputTokens;
    byFeature[entry.feature].outputTokens += entry.outputTokens;
    byFeature[entry.feature].costUsd += entry.costUsd;

    // By date (day)
    const day = entry.date.split("T")[0];
    if (!byDate[day]) {
      byDate[day] = { requests: 0, costUsd: 0 };
    }
    byDate[day].requests++;
    byDate[day].costUsd += entry.costUsd;
  }

  return {
    totalInputTokens,
    totalOutputTokens,
    totalCostUsd,
    totalRequests: entries.length,
    byFeature,
    byDate,
    recentEntries: entries.slice(-10).reverse(),
  };
}
