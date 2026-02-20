"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Transaction } from "@/types";
import { formatCurrency, formatShares } from "@/lib/calculations";
import { format } from "date-fns";
import { Trash } from "@phosphor-icons/react";

interface IndexedTransaction extends Transaction {
  holdingIndex: number;
}

interface TransactionHistoryProps {
  transactions: IndexedTransaction[];
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const router = useRouter();
  const t = useTranslations("Transaction");
  const [filter, setFilter] = useState("");
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filtered = filter
    ? sorted.filter((t) =>
        t.ticker.toLowerCase().includes(filter.toLowerCase())
      )
    : sorted;

  async function handleDelete(ticker: string, holdingIndex: number, rowKey: string) {
    if (confirmKey !== rowKey) {
      setConfirmKey(rowKey);
      return;
    }

    setDeletingKey(rowKey);
    try {
      const res = await fetch(
        `/api/portfolio?ticker=${encodeURIComponent(ticker)}&index=${holdingIndex}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setConfirmKey(null);
      router.refresh();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingKey(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("title")}</CardTitle>
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t("filterPlaceholder")}
          className="max-w-[180px] h-8 text-sm"
        />
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("ticker")}</TableHead>
                <TableHead className="text-right">{t("shares")}</TableHead>
                <TableHead className="text-right">{t("pricePerShare")}</TableHead>
                <TableHead className="text-right">{t("cost")}</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((txn) => {
                const rowKey = `${txn.ticker}-${txn.holdingIndex}`;
                const isConfirming = confirmKey === rowKey;
                const isDeleting = deletingKey === rowKey;

                return (
                  <TableRow key={rowKey} className="hover:bg-accent/50">
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(txn.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/stocks/${txn.ticker}`}
                        className="font-medium hover:underline"
                      >
                        {txn.ticker}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatShares(txn.shares)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatCurrency(txn.pricePerShare)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      {formatCurrency(txn.costUsd)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={isConfirming ? "destructive" : "ghost"}
                        size="icon-xs"
                        disabled={isDeleting}
                        onClick={() => handleDelete(txn.ticker, txn.holdingIndex, rowKey)}
                        title={isConfirming ? t("confirmDelete") : t("deleteTransaction")}
                        onBlur={() => {
                          if (isConfirming) setTimeout(() => setConfirmKey(null), 200);
                        }}
                      >
                        <Trash size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
