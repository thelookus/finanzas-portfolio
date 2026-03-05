"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface Transaction {
  id: number;
  type: "income" | "expense" | "transfer";
  amount: number;
  date: string;
  description?: string | null;
  payee?: string | null;
  categoryName?: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  currency?: string;
}

function formatMoney(amount: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function RecentTransactions({ transactions, currency = "ARS" }: RecentTransactionsProps) {
  const t = useTranslations("Finances");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("recentTransactions")}</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("noTransactions")}</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {tx.description || tx.payee || t("noDescription")}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(tx.date), "dd/MM")}
                    </span>
                    {tx.categoryName && (
                      <span className="text-xs text-muted-foreground">
                        {tx.categoryName}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`font-mono text-sm font-medium ${
                  tx.type === "income" ? "text-emerald-400" : "text-red-400"
                }`}>
                  {tx.type === "income" ? "+" : "-"}{formatMoney(tx.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
