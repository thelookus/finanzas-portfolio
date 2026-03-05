"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useEntity } from "@/lib/contexts/entity-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import { UploadSimple, CheckCircle, Warning, Tag } from "@phosphor-icons/react";

interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  suggestedCategory?: string;
  suggestedCategoryId?: number | null;
}

interface AccountRecord {
  id: number;
  name: string;
  type: string;
}

interface CategoryRecord {
  id: number;
  name: string;
  type: string;
  parentId: number | null;
}

type DocumentType = "credit_card" | "bank_statement" | "invoice" | "service_bill";

interface ImportResponse {
  importId: number;
  transactions: ParsedTransaction[];
  filename: string;
  documentType?: DocumentType;
  suggestedAccountId?: number | null;
  accounts?: AccountRecord[];
  categories?: CategoryRecord[];
}

function formatMoney(amount: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

const docTypeKeys: Record<DocumentType, string> = {
  bank_statement: "docType_bank_statement",
  credit_card: "docType_credit_card",
  invoice: "docType_invoice",
  service_bill: "docType_service_bill",
};

export function ImportDialog({ onImported }: { onImported: () => void }) {
  const t = useTranslations("Finances");
  const { currentEntity } = useEntity();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importData, setImportData] = useState<ImportResponse | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [transactionCategories, setTransactionCategories] = useState<Map<number, number>>(new Map());
  const [error, setError] = useState("");
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!currentEntity) return;
    // Reset input so re-selecting the same file triggers onChange
    if (fileRef.current) fileRef.current.value = "";
    setError("");
    setImportedCount(0);
    setUploading(true);
    setImportData(null);
    setTransactionCategories(new Map());

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityId", String(currentEntity.id));

      const res = await fetch("/api/finances/import", { method: "POST", body: formData });
      const data: ImportResponse = await res.json();

      if (!res.ok) {
        setError((data as unknown as { error: string }).error || t("importError"));
        return;
      }

      if (data.transactions.length === 0) {
        setError(t("importNoTransactions"));
        return;
      }

      setImportData(data);

      // Pre-fill account
      if (data.suggestedAccountId) {
        setSelectedAccountId(String(data.suggestedAccountId));
      } else if (data.accounts && data.accounts.length > 0) {
        setSelectedAccountId(String(data.accounts[0].id));
      }

      // Pre-fill categories
      const catMap = new Map<number, number>();
      data.transactions.forEach((tx, i) => {
        if (tx.suggestedCategoryId) {
          catMap.set(i, tx.suggestedCategoryId);
        }
      });
      setTransactionCategories(catMap);
    } catch {
      setError(t("importError"));
    } finally {
      setUploading(false);
    }
  }

  function handleCategoryChange(txIndex: number, categoryId: string) {
    setTransactionCategories((prev) => {
      const next = new Map(prev);
      if (categoryId === "none") {
        next.delete(txIndex);
      } else {
        next.set(txIndex, Number(categoryId));
      }
      return next;
    });
  }

  async function handleConfirm() {
    if (!currentEntity || !importData || importData.transactions.length === 0) return;
    const accountId = Number(selectedAccountId);
    if (!accountId) {
      setError(t("noAccountsError"));
      return;
    }

    setSaving(true);

    try {
      let count = 0;
      for (let i = 0; i < importData.transactions.length; i++) {
        const tx = importData.transactions[i];
        const categoryId = transactionCategories.get(i);

        const res = await fetch("/api/finances/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountId,
            type: tx.type,
            amount: tx.amount,
            date: tx.date,
            description: tx.description,
            payee: tx.description,
            ...(categoryId ? { categoryId } : {}),
          }),
        });
        if (res.ok) count++;
      }

      setImportedCount(count);
      setImportData(null);
      setTransactionCategories(new Map());
      onImported();
    } catch {
      setError(t("importError"));
    } finally {
      setSaving(false);
    }
  }

  const transactions = importData?.transactions || [];
  const accounts = importData?.accounts || [];
  const categories = importData?.categories || [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <UploadSimple size={16} className="mr-1" />
          {t("import")}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("importFile")}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 px-6 pb-6 space-y-4">
          {/* File input */}
          <div
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <UploadSimple size={32} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("dropOrClick")}</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, CSV</p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>

          {uploading && (
            <div className="flex items-center gap-2 justify-center py-4">
              <div className="size-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-sm text-muted-foreground">{t("parsing")}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <Warning size={16} />
              {error}
            </div>
          )}

          {importedCount > 0 && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle size={16} />
              {t("importedCount", { count: importedCount })}
            </div>
          )}

          {/* Preview */}
          {transactions.length > 0 && (
            <div className="space-y-3">
              {/* Document type badge */}
              {importData?.documentType && (
                <div className="flex items-center gap-2">
                  <Tag size={14} className="text-muted-foreground" />
                  <Badge variant="secondary">
                    {t(docTypeKeys[importData.documentType])}
                  </Badge>
                </div>
              )}

              {/* Account selector */}
              {accounts.length > 0 && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">{t("importAccount")}</label>
                  <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("selectAccount")} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={String(acc.id)}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <p className="text-sm font-medium">
                {t("foundTransactions", { count: transactions.length })}
              </p>

              <div className="max-h-80 overflow-y-auto space-y-2">
                {transactions.map((tx, i) => (
                  <div key={i} className="p-2 rounded-md bg-card border border-border text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                      <span className={`font-mono ml-2 whitespace-nowrap ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                        {tx.type === "income" ? "+" : "-"}{formatMoney(tx.amount)}
                      </span>
                    </div>
                    {/* Category selector */}
                    {categories.length > 0 && (
                      <Select
                        value={transactionCategories.has(i) ? String(transactionCategories.get(i)) : "none"}
                        onValueChange={(val) => handleCategoryChange(i, val)}
                      >
                        <SelectTrigger className="h-7 text-xs border-0 bg-transparent shadow-none px-0 w-auto gap-1 text-muted-foreground hover:text-foreground">
                          <SelectValue placeholder={t("selectCategory")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("selectCategory")}</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={handleConfirm} disabled={saving}>
                {saving ? t("importing") : t("confirmImport")}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
