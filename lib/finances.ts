import { db } from "@/lib/db";
import {
  entities,
  accounts,
  categories,
  transactions,
  budgets,
  recurringRules,
} from "@/lib/db/schema";
import { eq, and, gte, lte, desc, sql, like, asc, inArray } from "drizzle-orm";

// --- Entities ---

export async function getEntities(userId: string) {
  return db.select().from(entities).where(eq(entities.userId, userId));
}

export async function getEntityById(entityId: number, userId: string) {
  const [entity] = await db
    .select()
    .from(entities)
    .where(and(eq(entities.id, entityId), eq(entities.userId, userId)))
    .limit(1);
  return entity ?? null;
}

export async function createEntity(userId: string, data: { name: string; type: "personal" | "business"; currency?: string }) {
  const [entity] = await db.insert(entities).values({
    userId,
    name: data.name,
    type: data.type,
    currency: data.currency ?? "ARS",
  }).returning();
  return entity;
}

// --- Accounts ---

export async function getAccounts(entityId: number) {
  return db.select().from(accounts).where(eq(accounts.entityId, entityId));
}

export async function createAccount(entityId: number, data: {
  name: string;
  type: "checking" | "savings" | "credit" | "cash";
  currency?: string;
  initialBalance?: number;
  icon?: string;
  color?: string;
}) {
  const [account] = await db.insert(accounts).values({
    entityId,
    name: data.name,
    type: data.type,
    currency: data.currency ?? "ARS",
    initialBalance: data.initialBalance ?? 0,
    icon: data.icon,
    color: data.color,
  }).returning();
  return account;
}

export async function updateAccount(accountId: number, data: Partial<{
  name: string;
  type: "checking" | "savings" | "credit" | "cash";
  isArchived: number;
  icon: string;
  color: string;
}>) {
  const [account] = await db.update(accounts).set(data).where(eq(accounts.id, accountId)).returning();
  return account;
}

export async function getAccountBalance(accountId: number) {
  const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
  if (!account) return 0;

  const [result] = await db
    .select({
      income: sql<number>`COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)`,
      transferIn: sql<number>`COALESCE(SUM(CASE WHEN type = 'transfer' AND transfer_to_account_id = ${accountId} THEN amount ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.accountId, accountId));

  const [transferOut] = await db
    .select({
      total: sql<number>`COALESCE(SUM(amount), 0)`,
    })
    .from(transactions)
    .where(and(
      eq(transactions.type, "transfer"),
      eq(transactions.accountId, accountId),
    ));

  return account.initialBalance + (result?.income ?? 0) - (result?.expense ?? 0) + (result?.transferIn ?? 0) - (transferOut?.total ?? 0);
}

// --- Categories ---

export async function getCategories(entityId: number) {
  return db.select().from(categories).where(eq(categories.entityId, entityId)).orderBy(asc(categories.sortOrder));
}

export async function createCategory(entityId: number, data: {
  name: string;
  type: "expense" | "income" | "transfer";
  parentId?: number;
  icon?: string;
  color?: string;
}) {
  const [category] = await db.insert(categories).values({
    entityId,
    name: data.name,
    type: data.type,
    parentId: data.parentId,
    icon: data.icon,
    color: data.color,
  }).returning();
  return category;
}

export async function updateCategory(categoryId: number, data: Partial<{
  name: string;
  type: "expense" | "income" | "transfer";
  parentId: number | null;
  icon: string;
  color: string;
}>) {
  const [category] = await db.update(categories).set(data).where(eq(categories.id, categoryId)).returning();
  return category;
}

export async function deleteCategory(categoryId: number) {
  // Check if category is in use by transactions
  const [txCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(transactions)
    .where(eq(transactions.categoryId, categoryId));

  if (txCount.count > 0) {
    throw new Error("CATEGORY_IN_USE");
  }

  // Check if category is in use by budgets
  const [budgetCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(budgets)
    .where(eq(budgets.categoryId, categoryId));

  if (budgetCount.count > 0) {
    throw new Error("CATEGORY_IN_USE");
  }

  // Check if category is in use by recurring rules
  const [ruleCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(recurringRules)
    .where(eq(recurringRules.categoryId, categoryId));

  if (ruleCount.count > 0) {
    throw new Error("CATEGORY_IN_USE");
  }

  // Also delete child categories that are not in use
  const children = await db.select({ id: categories.id }).from(categories).where(eq(categories.parentId, categoryId));
  for (const child of children) {
    await deleteCategory(child.id);
  }

  await db.delete(categories).where(eq(categories.id, categoryId));
}

export async function deleteAccount(accountId: number) {
  const [account] = await db.update(accounts).set({ isArchived: 1 }).where(eq(accounts.id, accountId)).returning();
  return account;
}

// --- Transactions ---

export interface TransactionFilters {
  entityId: number;
  accountId?: number;
  categoryId?: number;
  type?: "income" | "expense" | "transfer";
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getTransactions(filters: TransactionFilters) {
  const accountIds = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.entityId, filters.entityId));

  if (accountIds.length === 0) return [];

  const idList = accountIds.map((a) => a.id);

  let query = db
    .select({
      id: transactions.id,
      accountId: transactions.accountId,
      type: transactions.type,
      amount: transactions.amount,
      date: transactions.date,
      categoryId: transactions.categoryId,
      description: transactions.description,
      payee: transactions.payee,
      notes: transactions.notes,
      importSource: transactions.importSource,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(
      and(
        sql`${transactions.accountId} IN (${sql.join(idList.map(id => sql`${id}`), sql`, `)})`,
        filters.accountId ? eq(transactions.accountId, filters.accountId) : undefined,
        filters.categoryId ? eq(transactions.categoryId, filters.categoryId) : undefined,
        filters.type ? eq(transactions.type, filters.type) : undefined,
        filters.dateFrom ? gte(transactions.date, filters.dateFrom) : undefined,
        filters.dateTo ? lte(transactions.date, filters.dateTo) : undefined,
        filters.search
          ? sql`(${transactions.description} LIKE ${'%' + filters.search + '%'} OR ${transactions.payee} LIKE ${'%' + filters.search + '%'})`
          : undefined,
      )
    )
    .orderBy(desc(transactions.date), desc(transactions.id))
    .$dynamic();

  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  if (filters.offset) {
    query = query.offset(filters.offset);
  }

  return query;
}

export async function createTransaction(data: {
  accountId: number;
  type: "income" | "expense" | "transfer";
  amount: number;
  date: string;
  categoryId?: number;
  description?: string;
  payee?: string;
  notes?: string;
  transferToAccountId?: number;
  importSource?: string;
  recurringRuleId?: number;
}) {
  const [tx] = await db.insert(transactions).values(data).returning();
  return tx;
}

export async function updateTransaction(txId: number, data: Partial<{
  amount: number;
  date: string;
  categoryId: number;
  description: string;
  payee: string;
  notes: string;
  type: "income" | "expense" | "transfer";
}>) {
  const [tx] = await db.update(transactions).set(data).where(eq(transactions.id, txId)).returning();
  return tx;
}

export async function deleteTransaction(txId: number) {
  await db.delete(transactions).where(eq(transactions.id, txId));
}

export async function bulkUpdateTransactions(
  ids: number[],
  data: Partial<{ categoryId: number; accountId: number }>
) {
  if (ids.length === 0) return;
  await db.update(transactions).set(data).where(inArray(transactions.id, ids));
}

export async function bulkDeleteTransactions(ids: number[]) {
  if (ids.length === 0) return;
  await db.delete(transactions).where(inArray(transactions.id, ids));
}

// --- Budgets ---

export async function getBudgets(entityId: number, year: number, month: number) {
  return db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.entityId, entityId),
        eq(budgets.year, year),
        eq(budgets.month, month)
      )
    );
}

export async function upsertBudget(entityId: number, categoryId: number, year: number, month: number, amount: number) {
  // Try to update first
  const [existing] = await db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.entityId, entityId),
        eq(budgets.categoryId, categoryId),
        eq(budgets.year, year),
        eq(budgets.month, month)
      )
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(budgets)
      .set({ budgetedAmount: amount })
      .where(eq(budgets.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db.insert(budgets).values({
    entityId,
    categoryId,
    year,
    month,
    budgetedAmount: amount,
  }).returning();
  return created;
}

// --- Recurring Rules ---

export async function getRecurringRules(entityId: number) {
  return db
    .select()
    .from(recurringRules)
    .where(eq(recurringRules.entityId, entityId))
    .orderBy(asc(recurringRules.nextDueDate));
}

export async function createRecurringRule(data: {
  entityId: number;
  accountId: number;
  categoryId?: number;
  type: "income" | "expense";
  amount: number;
  payee?: string;
  description?: string;
  frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "annual";
  startDate: string;
  nextDueDate: string;
  endDate?: string;
  autoCreate?: number;
}) {
  const [rule] = await db.insert(recurringRules).values(data).returning();
  return rule;
}

export async function updateRecurringRule(ruleId: number, data: Partial<{
  amount: number;
  payee: string;
  description: string;
  nextDueDate: string;
  isActive: number;
  endDate: string;
}>) {
  const [rule] = await db.update(recurringRules).set(data).where(eq(recurringRules.id, ruleId)).returning();
  return rule;
}

export async function deleteRecurringRule(ruleId: number) {
  await db.delete(recurringRules).where(eq(recurringRules.id, ruleId));
}

// --- Reports ---

export async function getTotalsByCategory(entityId: number, year: number, month: number) {
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const accountIds = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.entityId, entityId));

  if (accountIds.length === 0) return [];
  const idList = accountIds.map((a) => a.id);

  return db
    .select({
      categoryId: transactions.categoryId,
      type: transactions.type,
      total: sql<number>`SUM(${transactions.amount})`,
    })
    .from(transactions)
    .where(
      and(
        sql`${transactions.accountId} IN (${sql.join(idList.map(id => sql`${id}`), sql`, `)})`,
        sql`${transactions.date} LIKE ${monthStr + '%'}`,
      )
    )
    .groupBy(transactions.categoryId, transactions.type);
}

export async function getMonthlyTrend(entityId: number, months: number = 6) {
  const accountIds = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.entityId, entityId));

  if (accountIds.length === 0) return [];
  const idList = accountIds.map((a) => a.id);

  return db
    .select({
      month: sql<string>`SUBSTR(${transactions.date}, 1, 7)`,
      income: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END), 0)`,
      expense: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END), 0)`,
    })
    .from(transactions)
    .where(
      sql`${transactions.accountId} IN (${sql.join(idList.map(id => sql`${id}`), sql`, `)})`
    )
    .groupBy(sql`SUBSTR(${transactions.date}, 1, 7)`)
    .orderBy(desc(sql`SUBSTR(${transactions.date}, 1, 7)`))
    .limit(months);
}
