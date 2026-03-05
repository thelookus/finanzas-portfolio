"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useEntity } from "@/lib/contexts/entity-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TransactionForm } from "@/components/finances/transaction-form";
import { ImportDialog } from "@/components/finances/import-dialog";
import { EntitySwitcher } from "@/components/finances/entity-switcher";
import { QuickAddFAB } from "@/components/finances/quick-add-fab";
import { EmptyState } from "@/components/finances/empty-state";
import { Plus, Trash, PencilSimple, Receipt, X } from "@phosphor-icons/react";
import { format } from "date-fns";

interface Transaction {
  id: number;
  accountId: number;
  type: "income" | "expense" | "transfer";
  amount: number;
  date: string;
  categoryId: number | null;
  description: string | null;
  payee: string | null;
}

interface Category {
  id: number;
  name: string;
  type: string;
  parentId: number | null;
}

interface Account {
  id: number;
  name: string;
  type: string;
}

function formatMoney(amount: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export default function TransactionsPage() {
  const t = useTranslations("Finances");
  const { currentEntity } = useEntity();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentEntity) return;
    setLoading(true);

    const params = new URLSearchParams({ entityId: String(currentEntity.id), limit: "100" });
    if (search) params.set("search", search);
    if (typeFilter !== "all") params.set("type", typeFilter);

    const [txs, cats, accs] = await Promise.all([
      fetch(`/api/finances/transactions?${params}`).then((r) => r.json()),
      fetch(`/api/finances/categories?entityId=${currentEntity.id}`).then((r) => r.json()),
      fetch(`/api/finances/accounts?entityId=${currentEntity.id}`).then((r) => r.json()),
    ]);

    setTransactions(txs);
    setCategories(cats);
    setAccounts(accs);
    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
    setLoading(false);
  }, [currentEntity, search, typeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const catMap = new Map(categories.map((c) => [c.id, c]));

  function getCategoryName(categoryId: number | null) {
    if (!categoryId) return "";
    const cat = catMap.get(categoryId);
    if (!cat) return "";
    if (cat.parentId) {
      const parent = catMap.get(cat.parentId);
      return parent ? `${parent.name} / ${cat.name}` : cat.name;
    }
    return cat.name;
  }

  async function handleDelete(id: number) {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    await fetch(`/api/finances/transactions?id=${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    fetchData();
  }

  // Bulk operations
  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((tx) => tx.id)));
    }
  }

  async function handleBulkUpdate(update: { categoryId?: number; accountId?: number }) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    await fetch("/api/finances/transactions/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, update }),
    });
    fetchData();
  }

  async function handleBulkDelete() {
    if (!bulkDeleteConfirm) {
      setBulkDeleteConfirm(true);
      return;
    }
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    await fetch("/api/finances/transactions/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    fetchData();
  }

  const hasSelection = selectedIds.size > 0;
  const allSelected = transactions.length > 0 && selectedIds.size === transactions.length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("transactionsTitle")}</h1>
        <div className="flex items-center gap-2">
          <ImportDialog onImported={fetchData} />
          <Button size="sm" className="hidden md:flex" onClick={() => { setEditTx(null); setShowForm(true); }}>
            <Plus size={16} className="mr-1" />
            {t("add")}
          </Button>
          <EntitySwitcher />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allTypes")}</SelectItem>
            <SelectItem value="expense">{t("expense")}</SelectItem>
            <SelectItem value="income">{t("incomeLabel")}</SelectItem>
            <SelectItem value="transfer">{t("transfer")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {hasSelection && (
        <div className="flex items-center gap-2 flex-wrap p-3 rounded-lg bg-accent/50 border border-border">
          <span className="text-sm font-medium">
            {t("selectedCount", { count: selectedIds.size })}
          </span>

          <Select onValueChange={(val) => handleBulkUpdate({ categoryId: Number(val) })}>
            <SelectTrigger className="h-8 w-auto min-w-[160px] text-xs">
              <SelectValue placeholder={t("bulkSetCategory")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={(val) => handleBulkUpdate({ accountId: Number(val) })}>
            <SelectTrigger className="h-8 w-auto min-w-[160px] text-xs">
              <SelectValue placeholder={t("bulkSetAccount")} />
            </SelectTrigger>
            <SelectContent>
              {accounts.filter((a) => !(a as unknown as { isArchived: number }).isArchived).map((acc) => (
                <SelectItem key={acc.id} value={String(acc.id)}>
                  {acc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="destructive"
            size="sm"
            className="h-8 text-xs"
            onClick={handleBulkDelete}
          >
            <Trash size={14} className="mr-1" />
            {bulkDeleteConfirm ? t("confirmBulkDelete") : t("bulkDelete")}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs ml-auto"
            onClick={() => { setSelectedIds(new Set()); setBulkDeleteConfirm(false); }}
          >
            <X size={14} className="mr-1" />
            {t("cancel")}
          </Button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <Skeleton className="h-96 rounded-lg" />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={<Receipt size={48} />}
          title={t("emptyTransactionsTitle")}
          description={t("emptyTransactionsDescription")}
          action={{ label: t("addTransaction"), onClick: () => { setEditTx(null); setShowForm(true); } }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelected ? true : hasSelection ? "indeterminate" : false}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>{t("date")}</TableHead>
                    <TableHead>{t("descriptionLabel")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("category")}</TableHead>
                    <TableHead className="text-right">{t("amount")}</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id} className={`hover:bg-accent/50 ${selectedIds.has(tx.id) ? "bg-accent/30" : ""}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(tx.id)}
                          onCheckedChange={() => toggleSelect(tx.id)}
                        />
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(tx.date), "dd/MM/yy")}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium truncate max-w-[200px]">
                          {tx.description || tx.payee || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground md:hidden">
                          {getCategoryName(tx.categoryId)}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {getCategoryName(tx.categoryId)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono text-sm font-medium ${
                          tx.type === "income" ? "text-emerald-400" : "text-red-400"
                        }`}>
                          {tx.type === "income" ? "+" : "-"}{formatMoney(tx.amount, currentEntity?.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => { setEditTx(tx); setShowForm(true); }}
                          >
                            <PencilSimple size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-7 w-7 ${deleteConfirm === tx.id ? "text-red-400" : "text-muted-foreground"}`}
                            onClick={() => handleDelete(tx.id)}
                          >
                            <Trash size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Form Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm} modal={false}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editTx ? t("editTransaction") : t("addTransaction")}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 px-6 pb-6">
            <TransactionForm
              initialData={editTx ? {
                id: editTx.id,
                type: editTx.type === "transfer" ? "expense" : editTx.type,
                amount: editTx.amount,
                date: editTx.date,
                accountId: editTx.accountId,
                categoryId: editTx.categoryId ?? undefined,
                description: editTx.description ?? undefined,
                payee: editTx.payee ?? undefined,
              } : undefined}
              onSuccess={() => { setShowForm(false); fetchData(); }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <QuickAddFAB />
    </div>
  );
}
