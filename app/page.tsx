import { getTranslations } from "next-intl/server";
import { getPortfolio } from "@/lib/portfolio";
import { getQuotes } from "@/lib/yahoo-finance";
import { enrichHoldings } from "@/lib/calculations";
import { PortfolioSummary } from "@/components/dashboard/portfolio-summary";
import { HoldingsTable } from "@/components/dashboard/holdings-table";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { PnLChart } from "@/components/charts/pnl-chart";
import { TransactionHistory } from "@/components/dashboard/transaction-history";
import { DividendTracker } from "@/components/dashboard/dividend-tracker";
import { AddTransactionDialog } from "@/components/dashboard/add-transaction-dialog";
import { AIAdvisorDialog } from "@/components/dashboard/ai-advisor-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function DashboardContent() {
  const t = await getTranslations("Dashboard");
  const portfolio = getPortfolio();
  const tickers = portfolio.holdings.map((h) => h.ticker);
  const quotes = await getQuotes(tickers);
  const holdings = enrichHoldings(portfolio.holdings, quotes);
  const totalDividends = portfolio.dividends.reduce(
    (sum, d) => sum + d.amount,
    0
  );

  if (holdings.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {t("marketDataUnavailable")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <AIAdvisorDialog />
          <AddTransactionDialog existingTickers={tickers} />
        </div>
      </div>

      <PortfolioSummary
        holdings={holdings}
        totalInvested={portfolio.totalInvested}
        totalDividends={totalDividends}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("holdings")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <HoldingsTable holdings={holdings} />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t("allocation")}</CardTitle>
            </CardHeader>
            <CardContent>
              <AllocationChart holdings={holdings} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* P&L Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t("investedVsCurrent")}</CardTitle>
        </CardHeader>
        <CardContent>
          <PnLChart holdings={holdings} totalInvested={portfolio.totalInvested} />
        </CardContent>
      </Card>

      {/* Transactions & Dividends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TransactionHistory
          transactions={portfolio.holdings.flatMap((h) =>
            h.transactions.map((t, i) => ({ ...t, holdingIndex: i }))
          )}
        />
        <DividendTracker dividends={portfolio.dividends} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
