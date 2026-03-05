"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useEntity } from "@/lib/contexts/entity-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Account {
  id: number;
  name: string;
  type: string;
}

interface Category {
  id: number;
  name: string;
  type: string;
  parentId: number | null;
}

interface TransactionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    id?: number;
    type: "income" | "expense";
    amount: number;
    date: string;
    accountId: number;
    categoryId?: number;
    description?: string;
    payee?: string;
  };
}

export function TransactionForm({ onSuccess, onCancel, initialData }: TransactionFormProps) {
  const t = useTranslations("Finances");
  const { currentEntity } = useEntity();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [type, setType] = useState<"income" | "expense">(initialData?.type ?? "expense");
  const [amount, setAmount] = useState(initialData?.amount?.toString() ?? "");
  const [date, setDate] = useState(initialData?.date ?? new Date().toISOString().split("T")[0]);
  const [accountId, setAccountId] = useState(initialData?.accountId?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId?.toString() ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [payee, setPayee] = useState(initialData?.payee ?? "");

  useEffect(() => {
    if (!currentEntity) return;
    Promise.all([
      fetch(`/api/finances/accounts?entityId=${currentEntity.id}`).then((r) => r.json()),
      fetch(`/api/finances/categories?entityId=${currentEntity.id}`).then((r) => r.json()),
    ]).then(([accs, cats]) => {
      setAccounts(accs);
      setCategories(cats);
      if (accs.length > 0 && !accountId) setAccountId(String(accs[0].id));
    });
  }, [currentEntity]);

  const filteredCategories = categories.filter((c) => c.type === type && c.parentId !== null);
  const topCategories = categories.filter((c) => c.type === type && c.parentId === null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0 || !accountId || !date) {
      setError(t("errorRequired"));
      return;
    }

    setLoading(true);
    try {
      const body = {
        id: initialData?.id,
        accountId: Number(accountId),
        type,
        amount: amountNum,
        date,
        categoryId: categoryId ? Number(categoryId) : undefined,
        description: description || undefined,
        payee: payee || undefined,
      };

      const res = await fetch("/api/finances/transactions", {
        method: initialData?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();
      onSuccess();
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={type === "expense" ? "default" : "outline"}
          size="sm"
          className={type === "expense" ? "bg-red-500 hover:bg-red-600" : ""}
          onClick={() => setType("expense")}
        >
          {t("expense")}
        </Button>
        <Button
          type="button"
          variant={type === "income" ? "default" : "outline"}
          size="sm"
          className={type === "income" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
          onClick={() => setType("income")}
        >
          {t("incomeLabel")}
        </Button>
      </div>

      <div className="space-y-2">
        <Label>{t("amount")}</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>{t("date")}</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>{t("account")}</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger>
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
      </div>

      <div className="space-y-2">
        <Label>{t("category")}</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder={t("selectCategory")} />
          </SelectTrigger>
          <SelectContent>
            {topCategories.map((parent) => {
              const children = filteredCategories.filter((c) => c.parentId === parent.id);
              if (children.length === 0) {
                return (
                  <SelectItem key={parent.id} value={String(parent.id)}>
                    {parent.name}
                  </SelectItem>
                );
              }
              return children.map((child) => (
                <SelectItem key={child.id} value={String(child.id)}>
                  {parent.name} / {child.name}
                </SelectItem>
              ));
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("descriptionLabel")}</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("descriptionPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("payee")}</Label>
        <Input
          value={payee}
          onChange={(e) => setPayee(e.target.value)}
          placeholder={t("payeePlaceholder")}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? t("saving") : initialData?.id ? t("update") : t("add")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
