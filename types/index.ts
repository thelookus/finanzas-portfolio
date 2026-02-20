export interface Transaction {
  ticker: string;
  date: string;
  costUsd: number;
  shares: number;
  pricePerShare: number;
}

export interface Holding {
  ticker: string;
  totalShares: number;
  totalInvested: number;
  sector: string;
  transactions: Transaction[];
}

export interface Dividend {
  date: string;
  ticker: string;
  amount: number;
}

export interface Portfolio {
  holdings: Holding[];
  dividends: Dividend[];
  totalInvested: number;
}

export interface QuoteData {
  ticker: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap: number | null;
  name: string;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  peRatio: number | null;
  forwardPE: number | null;
  dividendYield: number | null;
  averageAnalystRating: string | null;
  targetMeanPrice: number | null;
  targetHighPrice: number | null;
  targetLowPrice: number | null;
}

export interface HoldingWithQuote extends Holding {
  quote: QuoteData;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
  weight: number;
  avgCost: number;
}

export interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalAnalysis {
  ticker: string;
  rsi14: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema12: number | null;
  ema26: number | null;
  macd: { macd: number; signal: number; histogram: number } | null;
  bollingerBands: { upper: number; middle: number; lower: number } | null;
  signals: Signal[];
}

export interface Signal {
  type: "buy" | "sell" | "neutral";
  indicator: string;
  message: string;
  strength: number; // 0-100
}

export interface Opportunity {
  ticker: string;
  name: string;
  price: number;
  score: number;
  signals: Signal[];
  rsi: number | null;
  distanceFromSMA200: number | null;
  distanceFrom52WLow: number | null;
  belowAnalystTarget: number | null;
}

export interface WatchlistItem {
  ticker: string;
  addedAt: string;
  notes?: string;
}

export interface PortfolioContext {
  holdings: {
    ticker: string;
    name: string;
    sector: string;
    shares: number;
    avgCost: number;
    currentPrice: number;
    value: number;
    weight: number;
    pnl: number;
    pnlPercent: number;
  }[];
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercent: number;
  sectors: { sector: string; weight: number }[];
}
