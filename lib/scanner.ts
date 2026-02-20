import { QuoteData, TechnicalAnalysis, Opportunity } from "@/types";

export function scoreOpportunity(
  quote: QuoteData,
  analysis: TechnicalAnalysis
): Opportunity {
  let score = 50; // Base score
  const signals = [...analysis.signals];

  // RSI oversold bonus
  const rsi = analysis.rsi14;
  if (rsi !== null) {
    if (rsi < 30) score += 20;
    else if (rsi < 40) score += 10;
    else if (rsi > 70) score -= 15;
  }

  // Distance from SMA200
  let distanceFromSMA200: number | null = null;
  if (analysis.sma200 !== null) {
    distanceFromSMA200 = ((quote.price - analysis.sma200) / analysis.sma200) * 100;
    if (distanceFromSMA200 < -10) score += 15;
    else if (distanceFromSMA200 < -5) score += 10;
    else if (distanceFromSMA200 > 20) score -= 10;
  }

  // Distance from 52-week low
  let distanceFrom52WLow: number | null = null;
  if (quote.fiftyTwoWeekLow > 0) {
    distanceFrom52WLow = ((quote.price - quote.fiftyTwoWeekLow) / quote.fiftyTwoWeekLow) * 100;
    if (distanceFrom52WLow < 10) score += 15;
    else if (distanceFrom52WLow < 20) score += 5;
  }

  // Below analyst target
  let belowAnalystTarget: number | null = null;
  if (quote.targetMeanPrice && quote.targetMeanPrice > 0) {
    belowAnalystTarget = ((quote.targetMeanPrice - quote.price) / quote.price) * 100;
    if (belowAnalystTarget > 20) score += 15;
    else if (belowAnalystTarget > 10) score += 10;
    else if (belowAnalystTarget < 0) score -= 10;
  }

  // MACD bullish
  if (analysis.macd && analysis.macd.histogram > 0) {
    score += 5;
  }

  // Bollinger at lower band
  if (analysis.bollingerBands && quote.price <= analysis.bollingerBands.lower) {
    score += 10;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    ticker: quote.ticker,
    name: quote.name,
    price: quote.price,
    score,
    signals,
    rsi,
    distanceFromSMA200,
    distanceFrom52WLow,
    belowAnalystTarget,
  };
}
