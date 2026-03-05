import { db } from "@/lib/db";
import {
  portfolioTransactions,
  portfolioDividends,
  watchlistItems,
  portfolioTickerMeta,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { Portfolio, Holding, Transaction, Dividend, WatchlistItem } from "@/types";

export async function getPortfolio(userId: string): Promise<Portfolio> {
  // Get aggregated holdings: GROUP BY ticker with SUM
  const holdingRows = await db
    .select({
      ticker: portfolioTransactions.ticker,
      totalShares: sql<number>`SUM(${portfolioTransactions.shares})`,
      totalInvested: sql<number>`SUM(${portfolioTransactions.costUsd})`,
      sector: sql<string>`COALESCE(${portfolioTickerMeta.sector}, 'Unknown')`,
    })
    .from(portfolioTransactions)
    .leftJoin(
      portfolioTickerMeta,
      and(
        eq(portfolioTickerMeta.userId, portfolioTransactions.userId),
        eq(portfolioTickerMeta.ticker, portfolioTransactions.ticker)
      )
    )
    .where(eq(portfolioTransactions.userId, userId))
    .groupBy(portfolioTransactions.ticker);

  // Get all transactions for this user
  const txRows = await db
    .select()
    .from(portfolioTransactions)
    .where(eq(portfolioTransactions.userId, userId))
    .orderBy(portfolioTransactions.date);

  // Get all dividends
  const divRows = await db
    .select()
    .from(portfolioDividends)
    .where(eq(portfolioDividends.userId, userId))
    .orderBy(portfolioDividends.date);

  // Build holdings with embedded transactions
  const holdings: Holding[] = holdingRows.map((h) => ({
    ticker: h.ticker,
    totalShares: h.totalShares,
    totalInvested: h.totalInvested,
    sector: h.sector,
    transactions: txRows
      .filter((t) => t.ticker === h.ticker)
      .map((t) => ({
        id: t.id,
        ticker: t.ticker,
        date: t.date,
        shares: t.shares,
        pricePerShare: t.pricePerShare,
        costUsd: t.costUsd,
      })),
  }));

  const dividends: Dividend[] = divRows.map((d) => ({
    id: d.id,
    date: d.date,
    ticker: d.ticker,
    amount: d.amount,
  }));

  const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);

  return { holdings, dividends, totalInvested };
}

export async function getHolding(userId: string, ticker: string): Promise<Holding | null> {
  const upperTicker = ticker.toUpperCase();

  const txRows = await db
    .select()
    .from(portfolioTransactions)
    .where(
      and(
        eq(portfolioTransactions.userId, userId),
        eq(portfolioTransactions.ticker, upperTicker)
      )
    )
    .orderBy(portfolioTransactions.date);

  if (txRows.length === 0) return null;

  const [meta] = await db
    .select()
    .from(portfolioTickerMeta)
    .where(
      and(
        eq(portfolioTickerMeta.userId, userId),
        eq(portfolioTickerMeta.ticker, upperTicker)
      )
    )
    .limit(1);

  const transactions: Transaction[] = txRows.map((t) => ({
    id: t.id,
    ticker: t.ticker,
    date: t.date,
    shares: t.shares,
    pricePerShare: t.pricePerShare,
    costUsd: t.costUsd,
  }));

  return {
    ticker: upperTicker,
    totalShares: transactions.reduce((sum, t) => sum + t.shares, 0),
    totalInvested: transactions.reduce((sum, t) => sum + t.costUsd, 0),
    sector: meta?.sector ?? "Unknown",
    transactions,
  };
}

export async function getTickers(userId: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ ticker: portfolioTransactions.ticker })
    .from(portfolioTransactions)
    .where(eq(portfolioTransactions.userId, userId));
  return rows.map((r) => r.ticker);
}

export async function addTransaction(
  userId: string,
  tx: Omit<Transaction, "id">,
  sector?: string
): Promise<Portfolio> {
  const upperTicker = tx.ticker.toUpperCase();

  await db.insert(portfolioTransactions).values({
    userId,
    ticker: upperTicker,
    date: tx.date,
    shares: tx.shares,
    pricePerShare: tx.pricePerShare,
    costUsd: tx.costUsd,
  });

  // Upsert ticker meta if sector provided
  if (sector) {
    await db
      .insert(portfolioTickerMeta)
      .values({ userId, ticker: upperTicker, sector })
      .onConflictDoUpdate({
        target: [portfolioTickerMeta.userId, portfolioTickerMeta.ticker],
        set: { sector },
      });
  } else {
    // Ensure meta exists even without sector
    const [existing] = await db
      .select()
      .from(portfolioTickerMeta)
      .where(
        and(
          eq(portfolioTickerMeta.userId, userId),
          eq(portfolioTickerMeta.ticker, upperTicker)
        )
      )
      .limit(1);
    if (!existing) {
      await db.insert(portfolioTickerMeta).values({
        userId,
        ticker: upperTicker,
        sector: "Unknown",
      });
    }
  }

  return getPortfolio(userId);
}

export async function updateTransaction(
  userId: string,
  txId: number,
  updatedData: Partial<Omit<Transaction, "id">> & { sector?: string }
): Promise<Portfolio> {
  // Verify ownership
  const [existing] = await db
    .select()
    .from(portfolioTransactions)
    .where(
      and(
        eq(portfolioTransactions.id, txId),
        eq(portfolioTransactions.userId, userId)
      )
    )
    .limit(1);

  if (!existing) {
    throw new Error(`Transaction not found: ${txId}`);
  }

  const newTicker = updatedData.ticker?.toUpperCase();
  const tickerChanged = newTicker && newTicker !== existing.ticker;

  // Update the transaction
  await db
    .update(portfolioTransactions)
    .set({
      ...(newTicker ? { ticker: newTicker } : {}),
      ...(updatedData.date !== undefined ? { date: updatedData.date } : {}),
      ...(updatedData.shares !== undefined ? { shares: updatedData.shares } : {}),
      ...(updatedData.pricePerShare !== undefined ? { pricePerShare: updatedData.pricePerShare } : {}),
      ...(updatedData.costUsd !== undefined ? { costUsd: updatedData.costUsd } : {}),
    })
    .where(eq(portfolioTransactions.id, txId));

  // If ticker changed, handle meta
  if (tickerChanged) {
    // Check if old ticker still has transactions
    const [oldCount] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(portfolioTransactions)
      .where(
        and(
          eq(portfolioTransactions.userId, userId),
          eq(portfolioTransactions.ticker, existing.ticker)
        )
      );
    if (oldCount.count === 0) {
      await db
        .delete(portfolioTickerMeta)
        .where(
          and(
            eq(portfolioTickerMeta.userId, userId),
            eq(portfolioTickerMeta.ticker, existing.ticker)
          )
        );
    }

    // Ensure meta for new ticker
    if (updatedData.sector) {
      await db
        .insert(portfolioTickerMeta)
        .values({ userId, ticker: newTicker, sector: updatedData.sector })
        .onConflictDoUpdate({
          target: [portfolioTickerMeta.userId, portfolioTickerMeta.ticker],
          set: { sector: updatedData.sector },
        });
    } else {
      const [existingMeta] = await db
        .select()
        .from(portfolioTickerMeta)
        .where(
          and(
            eq(portfolioTickerMeta.userId, userId),
            eq(portfolioTickerMeta.ticker, newTicker)
          )
        )
        .limit(1);
      if (!existingMeta) {
        await db.insert(portfolioTickerMeta).values({
          userId,
          ticker: newTicker,
          sector: "Unknown",
        });
      }
    }
  }

  return getPortfolio(userId);
}

export async function deleteTransaction(
  userId: string,
  txId: number
): Promise<Portfolio> {
  // Verify ownership and get ticker
  const [existing] = await db
    .select()
    .from(portfolioTransactions)
    .where(
      and(
        eq(portfolioTransactions.id, txId),
        eq(portfolioTransactions.userId, userId)
      )
    )
    .limit(1);

  if (!existing) {
    throw new Error(`Transaction not found: ${txId}`);
  }

  await db.delete(portfolioTransactions).where(eq(portfolioTransactions.id, txId));

  // Clean up meta if no more transactions for this ticker
  const [remaining] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(portfolioTransactions)
    .where(
      and(
        eq(portfolioTransactions.userId, userId),
        eq(portfolioTransactions.ticker, existing.ticker)
      )
    );
  if (remaining.count === 0) {
    await db
      .delete(portfolioTickerMeta)
      .where(
        and(
          eq(portfolioTickerMeta.userId, userId),
          eq(portfolioTickerMeta.ticker, existing.ticker)
        )
      );
  }

  return getPortfolio(userId);
}

export async function addDividend(
  userId: string,
  dividend: Omit<Dividend, "id">
): Promise<Portfolio> {
  await db.insert(portfolioDividends).values({
    userId,
    ticker: dividend.ticker.toUpperCase(),
    date: dividend.date,
    amount: dividend.amount,
  });
  return getPortfolio(userId);
}

export async function getWatchlist(userId: string): Promise<WatchlistItem[]> {
  const rows = await db
    .select()
    .from(watchlistItems)
    .where(eq(watchlistItems.userId, userId))
    .orderBy(watchlistItems.addedAt);
  return rows.map((r) => ({
    id: r.id,
    ticker: r.ticker,
    addedAt: r.addedAt,
    notes: r.notes ?? undefined,
  }));
}

export async function addWatchlistItem(
  userId: string,
  ticker: string,
  notes?: string
): Promise<WatchlistItem> {
  const [item] = await db
    .insert(watchlistItems)
    .values({
      userId,
      ticker: ticker.toUpperCase(),
      notes: notes ?? null,
    })
    .returning();
  return {
    id: item.id,
    ticker: item.ticker,
    addedAt: item.addedAt,
    notes: item.notes ?? undefined,
  };
}

export async function removeWatchlistItem(
  userId: string,
  ticker: string
): Promise<void> {
  await db
    .delete(watchlistItems)
    .where(
      and(
        eq(watchlistItems.userId, userId),
        eq(watchlistItems.ticker, ticker.toUpperCase())
      )
    );
}
