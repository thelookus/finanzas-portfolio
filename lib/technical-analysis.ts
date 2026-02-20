import { RSI, SMA, EMA, MACD, BollingerBands } from "technicalindicators";
import { CandleData, TechnicalAnalysis, Signal } from "@/types";

export function computeTechnicalAnalysis(
  ticker: string,
  candles: CandleData[]
): TechnicalAnalysis {
  const closes = candles.map((c) => c.close);

  const rsi14Values = RSI.calculate({ values: closes, period: 14 });
  const rsi14 = rsi14Values.length > 0 ? rsi14Values[rsi14Values.length - 1] : null;

  const sma20Values = SMA.calculate({ values: closes, period: 20 });
  const sma20 = sma20Values.length > 0 ? sma20Values[sma20Values.length - 1] : null;

  const sma50Values = SMA.calculate({ values: closes, period: 50 });
  const sma50 = sma50Values.length > 0 ? sma50Values[sma50Values.length - 1] : null;

  const sma200Values = SMA.calculate({ values: closes, period: 200 });
  const sma200 = sma200Values.length > 0 ? sma200Values[sma200Values.length - 1] : null;

  const ema12Values = EMA.calculate({ values: closes, period: 12 });
  const ema12 = ema12Values.length > 0 ? ema12Values[ema12Values.length - 1] : null;

  const ema26Values = EMA.calculate({ values: closes, period: 26 });
  const ema26 = ema26Values.length > 0 ? ema26Values[ema26Values.length - 1] : null;

  const macdValues = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const macdLast = macdValues.length > 0 ? macdValues[macdValues.length - 1] : null;
  const macd = macdLast && macdLast.MACD != null && macdLast.signal != null && macdLast.histogram != null
    ? { macd: macdLast.MACD, signal: macdLast.signal, histogram: macdLast.histogram }
    : null;

  const bbValues = BollingerBands.calculate({
    values: closes,
    period: 20,
    stdDev: 2,
  });
  const bbLast = bbValues.length > 0 ? bbValues[bbValues.length - 1] : null;
  const bollingerBands = bbLast
    ? { upper: bbLast.upper, middle: bbLast.middle, lower: bbLast.lower }
    : null;

  const currentPrice = closes[closes.length - 1];
  const signals = generateSignals(currentPrice, rsi14, sma20, sma50, sma200, macd, bollingerBands);

  return {
    ticker,
    rsi14,
    sma20,
    sma50,
    sma200,
    ema12,
    ema26,
    macd,
    bollingerBands,
    signals,
  };
}

function generateSignals(
  price: number,
  rsi: number | null,
  sma20: number | null,
  sma50: number | null,
  sma200: number | null,
  macd: { macd: number; signal: number; histogram: number } | null,
  bb: { upper: number; middle: number; lower: number } | null
): Signal[] {
  const signals: Signal[] = [];

  // RSI signals
  if (rsi !== null) {
    if (rsi < 30) {
      signals.push({
        type: "buy",
        indicator: "RSI",
        message: `RSI oversold at ${rsi.toFixed(1)}`,
        strength: Math.min(100, (30 - rsi) * 5),
      });
    } else if (rsi > 70) {
      signals.push({
        type: "sell",
        indicator: "RSI",
        message: `RSI overbought at ${rsi.toFixed(1)}`,
        strength: Math.min(100, (rsi - 70) * 5),
      });
    } else {
      signals.push({
        type: "neutral",
        indicator: "RSI",
        message: `RSI neutral at ${rsi.toFixed(1)}`,
        strength: 0,
      });
    }
  }

  // Price vs SMA200
  if (sma200 !== null) {
    const distPercent = ((price - sma200) / sma200) * 100;
    if (distPercent < -5) {
      signals.push({
        type: "buy",
        indicator: "SMA200",
        message: `${Math.abs(distPercent).toFixed(1)}% below SMA(200)`,
        strength: Math.min(100, Math.abs(distPercent) * 3),
      });
    } else if (distPercent > 15) {
      signals.push({
        type: "sell",
        indicator: "SMA200",
        message: `${distPercent.toFixed(1)}% above SMA(200)`,
        strength: Math.min(100, distPercent * 2),
      });
    }
  }

  // Golden/Death cross (SMA50 vs SMA200)
  if (sma50 !== null && sma200 !== null) {
    if (sma50 > sma200) {
      signals.push({
        type: "buy",
        indicator: "MA Cross",
        message: "Golden cross: SMA(50) above SMA(200)",
        strength: 40,
      });
    } else {
      signals.push({
        type: "sell",
        indicator: "MA Cross",
        message: "Death cross: SMA(50) below SMA(200)",
        strength: 40,
      });
    }
  }

  // MACD
  if (macd !== null) {
    if (macd.histogram > 0 && macd.macd > macd.signal) {
      signals.push({
        type: "buy",
        indicator: "MACD",
        message: "MACD bullish crossover",
        strength: 50,
      });
    } else if (macd.histogram < 0 && macd.macd < macd.signal) {
      signals.push({
        type: "sell",
        indicator: "MACD",
        message: "MACD bearish crossover",
        strength: 50,
      });
    }
  }

  // Bollinger Bands
  if (bb !== null) {
    if (price <= bb.lower) {
      signals.push({
        type: "buy",
        indicator: "Bollinger",
        message: "Price at lower Bollinger Band",
        strength: 60,
      });
    } else if (price >= bb.upper) {
      signals.push({
        type: "sell",
        indicator: "Bollinger",
        message: "Price at upper Bollinger Band",
        strength: 60,
      });
    }
  }

  return signals;
}
