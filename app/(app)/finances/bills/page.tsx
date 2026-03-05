"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useEntity } from "@/lib/contexts/entity-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { EntitySwitcher } from "@/components/finances/entity-switcher";
import { EmptyState } from "@/components/finances/empty-state";
import { Plus, CheckCircle, Warning, Clock, Trash, CalendarBlank, ArrowCounterClockwise } from "@phosphor-icons/react";
import { format, isBefore, addDays } from "date-fns";

interface RecurringRule {
  id: number;
  entityId: number;
  accountId: number;
  categoryId: number | null;
  type: "income" | "expense";
  amount: number;
  payee: string | null;
  description: string | null;
  frequency: string;
  startDate: string;
  nextDueDate: string;
  endDate: string | null;
  isActive: number;
}

interface Account {
  id: number;
  name: string;
}

interface LastPayment {
  ruleId: number;
  transactionId: number;
  previousDueDate: string;
}

function formatMoney(amount: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function getStatus(nextDue: string): "overdue" | "upcoming" | "ok" {
  const due = new Date(nextDue);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isBefore(due, today)) return "overdue";
  if (isBefore(due, addDays(today, 7))) return "upcoming";
  return "ok";
}

const FREQ_LABELS: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  quarterly: "Trimestral",
  annual: "Anual",
};

export default function BillsPage() {
  const t = useTranslations("Finances");
  const { currentEntity } = useEntity();
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formPayee, setFormPayee] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState<"expense" | "income">("expense");
  const [formFrequency, setFormFrequency] = useState("monthly");
  const [formAccountId, setFormAccountId] = useState("");
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState<number | null>(null);
  const [lastPayment, setLastPayment] = useState<LastPayment | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentEntity) return;
    setLoading(true);

    const [rulesRes, accsRes] = await Promise.all([
      fetch(`/api/finances/recurring?entityId=${currentEntity.id}`).then((r) => r.json()),
      fetch(`/api/finances/accounts?entityId=${currentEntity.id}`).then((r) => r.json()),
    ]);

    setRules(rulesRes);
    setAccounts(accsRes);
    if (accsRes.length > 0 && !formAccountId) setFormAccountId(String(accsRes[0].id));
    setLoading(false);
  }, [currentEntity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!lastPayment) return;
    const timer = setTimeout(() => setLastPayment(null), 15_000);
    return () => clearTimeout(timer);
  }, [lastPayment]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!currentEntity || !formPayee || !formAmount || !formAccountId) return;
    setSaving(true);

    await fetch("/api/finances/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entityId: currentEntity.id,
        accountId: Number(formAccountId),
        type: formType,
        amount: parseFloat(formAmount),
        payee: formPayee,
        frequency: formFrequency,
        startDate: formStartDate,
        nextDueDate: formStartDate,
      }),
    });

    setSaving(false);
    setShowForm(false);
    setFormPayee("");
    setFormAmount("");
    fetchData();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/finances/recurring?id=${id}`, { method: "DELETE" });
    fetchData();
  }

  async function markPaid(rule: RecurringRule) {
    if (markingPaidId !== null) return;
    setMarkingPaidId(rule.id);

    try {
      // Create transaction
      const res = await fetch("/api/finances/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: rule.accountId,
          type: rule.type,
          amount: rule.amount,
          date: new Date().toISOString().split("T")[0],
          description: rule.description || rule.payee,
          payee: rule.payee,
          categoryId: rule.categoryId,
          recurringRuleId: rule.id,
        }),
      });
      const tx = await res.json();

      // Save previous due date for undo
      const previousDueDate = rule.nextDueDate;

      // Advance next due date
      const nextDue = new Date(rule.nextDueDate);
      const freqMap: Record<string, number> = {
        weekly: 7,
        biweekly: 14,
        monthly: 30,
        quarterly: 90,
        annual: 365,
      };
      nextDue.setDate(nextDue.getDate() + (freqMap[rule.frequency] || 30));

      await fetch("/api/finances/recurring", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id, nextDueDate: nextDue.toISOString().split("T")[0] }),
      });

      setLastPayment({ ruleId: rule.id, transactionId: tx.id, previousDueDate });
      fetchData();
    } finally {
      setMarkingPaidId(null);
    }
  }

  async function undoPayment() {
    if (!lastPayment) return;
    const { ruleId, transactionId, previousDueDate } = lastPayment;
    setLastPayment(null);

    // Delete the transaction
    await fetch(`/api/finances/transactions?id=${transactionId}`, { method: "DELETE" });

    // Restore previous due date
    await fetch("/api/finances/recurring", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ruleId, nextDueDate: previousDueDate }),
    });

    fetchData();
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("billsTitle")}</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus size={16} className="mr-1" />
            {t("add")}
          </Button>
          <EntitySwitcher />
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-64 rounded-lg" />
      ) : rules.length === 0 ? (
        <EmptyState
          icon={<CalendarBlank size={48} />}
          title={t("emptyBillsTitle")}
          description={t("emptyBillsDescription")}
          action={{ label: t("addRecurringPayment"), onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => {
            const status = getStatus(rule.nextDueDate);
            const statusConfig = {
              overdue: { icon: Warning, color: "text-red-400", bg: "bg-red-400/10", label: t("overdue") },
              upcoming: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-400/10", label: t("upcoming") },
              ok: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10", label: t("onTrack") },
            }[status];

            return (
              <Card key={rule.id}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                        <statusConfig.icon size={18} className={statusConfig.color} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{rule.payee || rule.description || "-"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{FREQ_LABELS[rule.frequency] || rule.frequency}</span>
                          <span>{format(new Date(rule.nextDueDate), "dd/MM/yy")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm font-medium ${
                        rule.type === "income" ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {formatMoney(rule.amount, currentEntity?.currency)}
                      </span>
                      {lastPayment?.ruleId === rule.id ? (
                        <Button variant="ghost" size="sm" className="text-xs text-yellow-500" onClick={undoPayment}>
                          <ArrowCounterClockwise size={14} className="mr-1" />
                          {t("undoPayment")}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          disabled={markingPaidId === rule.id}
                          onClick={() => markPaid(rule)}
                        >
                          {markingPaidId === rule.id ? t("saving") : t("markPaid")}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => handleDelete(rule.id)}>
                        <Trash size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Form Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm} modal={false}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t("addRecurring")}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleCreate} className="mt-4 px-6 pb-6 space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant={formType === "expense" ? "default" : "outline"} size="sm" className={formType === "expense" ? "bg-red-500 hover:bg-red-600" : ""} onClick={() => setFormType("expense")}>
                {t("expense")}
              </Button>
              <Button type="button" variant={formType === "income" ? "default" : "outline"} size="sm" className={formType === "income" ? "bg-emerald-500 hover:bg-emerald-600" : ""} onClick={() => setFormType("income")}>
                {t("incomeLabel")}
              </Button>
            </div>
            <div className="space-y-2">
              <Label>{t("payee")}</Label>
              <Input value={formPayee} onChange={(e) => setFormPayee(e.target.value)} placeholder={t("payeePlaceholder")} required />
            </div>
            <div className="space-y-2">
              <Label>{t("amount")}</Label>
              <Input type="number" step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00" required />
            </div>
            <div className="space-y-2">
              <Label>{t("frequency")}</Label>
              <Select value={formFrequency} onValueChange={setFormFrequency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="biweekly">Quincenal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("account")}</Label>
              <Select value={formAccountId} onValueChange={setFormAccountId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={String(acc.id)}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("startDate")}</Label>
              <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? t("saving") : t("create")}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
