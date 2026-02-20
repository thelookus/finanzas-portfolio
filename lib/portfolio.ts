import { Portfolio, Holding, Transaction, Dividend, WatchlistItem } from "@/types";
import fs from "fs";
import path from "path";

const PORTFOLIO_PATH = path.join(process.cwd(), "data", "portfolio.json");
const WATCHLIST_PATH = path.join(process.cwd(), "data", "watchlist.json");

export function getPortfolio(): Portfolio {
  const data = fs.readFileSync(PORTFOLIO_PATH, "utf-8");
  return JSON.parse(data) as Portfolio;
}

export function getHolding(ticker: string): Holding | undefined {
  const portfolio = getPortfolio();
  return portfolio.holdings.find(
    (h) => h.ticker.toUpperCase() === ticker.toUpperCase()
  );
}

export function getTickers(): string[] {
  const portfolio = getPortfolio();
  return portfolio.holdings.map((h) => h.ticker);
}

export function getWatchlist(): WatchlistItem[] {
  try {
    const data = fs.readFileSync(WATCHLIST_PATH, "utf-8");
    return JSON.parse(data) as WatchlistItem[];
  } catch {
    return [];
  }
}

export function saveWatchlist(items: WatchlistItem[]): void {
  fs.writeFileSync(WATCHLIST_PATH, JSON.stringify(items, null, 2));
}

export function savePortfolio(portfolio: Portfolio): void {
  fs.writeFileSync(PORTFOLIO_PATH, JSON.stringify(portfolio, null, 2));
}

function recalcHolding(holding: Holding): void {
  holding.totalShares = holding.transactions.reduce((sum, t) => sum + t.shares, 0);
  holding.totalInvested = holding.transactions.reduce((sum, t) => sum + t.costUsd, 0);
}

function recalcPortfolioTotal(portfolio: Portfolio): void {
  portfolio.totalInvested = portfolio.holdings.reduce((sum, h) => sum + h.totalInvested, 0);
}

export function addTransaction(transaction: Transaction, sector?: string): Portfolio {
  const portfolio = getPortfolio();
  let holding = portfolio.holdings.find(
    (h) => h.ticker.toUpperCase() === transaction.ticker.toUpperCase()
  );

  if (!holding) {
    holding = {
      ticker: transaction.ticker.toUpperCase(),
      totalShares: 0,
      totalInvested: 0,
      sector: sector || "Unknown",
      transactions: [],
    };
    portfolio.holdings.push(holding);
  }

  holding.transactions.push(transaction);
  recalcHolding(holding);
  recalcPortfolioTotal(portfolio);
  savePortfolio(portfolio);
  return portfolio;
}

export function deleteTransaction(ticker: string, index: number): Portfolio {
  const portfolio = getPortfolio();
  const holding = portfolio.holdings.find(
    (h) => h.ticker.toUpperCase() === ticker.toUpperCase()
  );

  if (!holding) {
    throw new Error(`Holding not found: ${ticker}`);
  }

  if (index < 0 || index >= holding.transactions.length) {
    throw new Error(`Transaction index out of range: ${index}`);
  }

  holding.transactions.splice(index, 1);

  if (holding.transactions.length === 0) {
    portfolio.holdings = portfolio.holdings.filter(
      (h) => h.ticker.toUpperCase() !== ticker.toUpperCase()
    );
  } else {
    recalcHolding(holding);
  }

  recalcPortfolioTotal(portfolio);
  savePortfolio(portfolio);
  return portfolio;
}

export function addDividend(dividend: Dividend): Portfolio {
  const portfolio = getPortfolio();
  portfolio.dividends.push(dividend);
  savePortfolio(portfolio);
  return portfolio;
}
