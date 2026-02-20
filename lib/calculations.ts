import { Holding, HoldingWithQuote, QuoteData } from "@/types";

export function getAvgCost(holding: Holding): number {
  return holding.totalInvested / holding.totalShares;
}

export function getPnL(holding: Holding, currentPrice: number) {
  const currentValue = holding.totalShares * currentPrice;
  const pnl = currentValue - holding.totalInvested;
  const pnlPercent =
    holding.totalInvested > 0 ? (pnl / holding.totalInvested) * 100 : 0;
  return { currentValue, pnl, pnlPercent };
}

export function getDailyChange(holding: Holding, quote: QuoteData) {
  const dailyChange = holding.totalShares * (quote.price - quote.previousClose);
  const dailyChangePercent = quote.changePercent;
  return { dailyChange, dailyChangePercent };
}

export function getWeight(
  holding: Holding,
  currentPrice: number,
  totalPortfolioValue: number
): number {
  if (totalPortfolioValue === 0) return 0;
  return ((holding.totalShares * currentPrice) / totalPortfolioValue) * 100;
}

export function enrichHoldings(
  holdings: Holding[],
  quotes: Map<string, QuoteData>
): HoldingWithQuote[] {
  const totalValue = holdings.reduce((sum, h) => {
    const quote = quotes.get(h.ticker);
    return sum + (quote ? h.totalShares * quote.price : 0);
  }, 0);

  return holdings
    .map((holding) => {
      const quote = quotes.get(holding.ticker);
      if (!quote) return null;

      const { currentValue, pnl, pnlPercent } = getPnL(holding, quote.price);
      const { dailyChange, dailyChangePercent } = getDailyChange(
        holding,
        quote
      );
      const weight = getWeight(holding, quote.price, totalValue);
      const avgCost = getAvgCost(holding);

      return {
        ...holding,
        quote,
        currentValue,
        pnl,
        pnlPercent,
        dailyChange,
        dailyChangePercent,
        weight,
        avgCost,
      } as HoldingWithQuote;
    })
    .filter((h): h is HoldingWithQuote => h !== null)
    .sort((a, b) => b.currentValue - a.currentValue);
}

export function formatCurrency(value: number, decimals = 2): string {
  return `$${value.toFixed(decimals)}`;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatShares(value: number): string {
  return value.toFixed(6);
}
