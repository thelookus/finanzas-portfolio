"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useEntity } from "@/lib/contexts/entity-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Skeleton } from "@/components/ui/skeleton";
import { EntitySwitcher } from "@/components/finances/entity-switcher";
import { EmptyState } from "@/components/finances/empty-state";
import {
  Plus,
  Bank,
  PencilSimple,
  Archive,
  ArrowCounterClockwise,
  CreditCard,
  Wallet,
  PiggyBank,
  Money,
} from "@phosphor-icons/react";

interface Account {
  id: number;
  entityId: number;
  name: string;
  type: "checking" | "savings" | "credit" | "cash";
  currency: string;
  initialBalance: number;
  icon: string | null;
  color: string | null;
  isArchived: number;
  createdAt: string;
}

const ACCOUNT_TYPE_ICONS: Record<string, typeof Bank> = {
  checking: Bank,
  savings: PiggyBank,
  credit: CreditCard,
  cash: Money,
};

function formatMoney(amount: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AccountsPage() {
  const t = useTranslations("Finances");
  const { currentEntity } = useEntity();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [balances, setBalances] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<Account["type"]>("checking");
  const [formInitialBalance, setFormInitialBalance] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentEntity) return;
    setLoading(true);

    const res = await fetch(
      `/api/finances/accounts?entityId=${currentEntity.id}`
    );
    const data: Account[] = await res.json();
    setAccounts(data);

    // Fetch balances for all active accounts
    const balanceMap: Record<number, number> = {};
    for (const acc of data) {
      balanceMap[acc.id] = acc.initialBalance;
    }
    setBalances(balanceMap);
    setLoading(false);
  }, [currentEntity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreate() {
    setEditingAccount(null);
    setFormName("");
    setFormType("checking");
    setFormInitialBalance("");
    setShowForm(true);
  }

  function openEdit(account: Account) {
    setEditingAccount(account);
    setFormName(account.name);
    setFormType(account.type);
    setFormInitialBalance("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentEntity || !formName.trim()) return;
    setSaving(true);

    if (editingAccount) {
      await fetch("/api/finances/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAccount.id,
          name: formName,
          type: formType,
        }),
      });
    } else {
      await fetch("/api/finances/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: currentEntity.id,
          name: formName,
          type: formType,
          initialBalance: formInitialBalance
            ? parseFloat(formInitialBalance)
            : 0,
        }),
      });
    }

    setSaving(false);
    setShowForm(false);
    fetchData();
  }

  async function handleArchive(account: Account) {
    if (!confirm(t("archiveConfirm"))) return;
    await fetch(`/api/finances/accounts?id=${account.id}`, {
      method: "DELETE",
    });
    fetchData();
  }

  async function handleUnarchive(account: Account) {
    await fetch("/api/finances/accounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: account.id, isArchived: 0 }),
    });
    fetchData();
  }

  const visibleAccounts = accounts.filter(
    (a) => showArchived || a.isArchived === 0
  );

  const typeKey = (type: string) => `accountType_${type}` as const;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("accountsTitle")}</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openCreate}>
            <Plus size={16} className="mr-1" />
            {t("add")}
          </Button>
          <EntitySwitcher />
        </div>
      </div>

      {accounts.some((a) => a.isArchived === 1) && (
        <div className="flex items-center gap-2">
          <Switch
            checked={showArchived}
            onCheckedChange={setShowArchived}
            id="show-archived"
          />
          <Label htmlFor="show-archived" className="text-sm text-muted-foreground cursor-pointer">
            {t("showArchived")}
          </Label>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : visibleAccounts.length === 0 ? (
        <EmptyState
          icon={<Wallet size={48} />}
          title={t("emptyAccountsTitle")}
          description={t("emptyAccountsDescription")}
          action={{ label: t("addAccount"), onClick: openCreate }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleAccounts.map((account) => {
            const TypeIcon = ACCOUNT_TYPE_ICONS[account.type] || Bank;
            const balance = balances[account.id] ?? 0;

            return (
              <Card
                key={account.id}
                className={account.isArchived ? "opacity-60" : ""}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <TypeIcon
                          size={20}
                          className="text-primary"
                          weight="duotone"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{account.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {t(typeKey(account.type))}
                          </span>
                          {account.isArchived === 1 && (
                            <span className="text-xs text-yellow-500 font-medium">
                              ({t("archived")})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="font-mono text-sm font-semibold">
                      {formatMoney(balance, account.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 mt-3 justify-end">
                    {account.isArchived === 0 ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => openEdit(account)}
                        >
                          <PencilSimple size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => handleArchive(account)}
                        >
                          <Archive size={14} />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleUnarchive(account)}
                      >
                        <ArrowCounterClockwise size={14} className="mr-1" />
                        {t("unarchiveAccount")}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm} modal={false}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingAccount ? t("editAccount") : t("addAccount")}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit} className="mt-4 px-6 pb-6 space-y-4">
            <div className="space-y-2">
              <Label>{t("accountName")}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t("accountName")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("accountType")}</Label>
              <Select
                value={formType}
                onValueChange={(v) => setFormType(v as Account["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t("accountType_cash")}</SelectItem>
                  <SelectItem value="checking">
                    {t("accountType_checking")}
                  </SelectItem>
                  <SelectItem value="savings">
                    {t("accountType_savings")}
                  </SelectItem>
                  <SelectItem value="credit">
                    {t("accountType_credit")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editingAccount && (
              <div className="space-y-2">
                <Label>{t("initialBalance")}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formInitialBalance}
                  onChange={(e) => setFormInitialBalance(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={saving}>
              {saving
                ? t("saving")
                : editingAccount
                ? t("update")
                : t("create")}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
