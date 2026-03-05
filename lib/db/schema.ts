import { sqliteTable, text, integer, real, uniqueIndex, primaryKey } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const userSettings = sqliteTable("user_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique().references(() => users.id),
  enabledModules: text("enabled_modules").notNull().default('["portfolio","finances"]'),
  defaultEntityId: integer("default_entity_id"),
  locale: text("locale").notNull().default("es-AR"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const entities = sqliteTable("entities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["personal", "business"] }).notNull(),
  currency: text("currency").notNull().default("ARS"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityId: integer("entity_id").notNull().references(() => entities.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["checking", "savings", "credit", "cash"] }).notNull(),
  currency: text("currency").notNull().default("ARS"),
  initialBalance: real("initial_balance").notNull().default(0),
  icon: text("icon"),
  color: text("color"),
  isArchived: integer("is_archived").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityId: integer("entity_id").notNull().references(() => entities.id),
  name: text("name").notNull(),
  parentId: integer("parent_id"),
  type: text("type", { enum: ["expense", "income", "transfer"] }).notNull(),
  icon: text("icon"),
  color: text("color"),
  isTaxDeductible: integer("is_tax_deductible").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  type: text("type", { enum: ["income", "expense", "transfer"] }).notNull(),
  amount: real("amount").notNull(),
  date: text("date").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  description: text("description"),
  payee: text("payee"),
  notes: text("notes"),
  recurringRuleId: integer("recurring_rule_id"),
  transferToAccountId: integer("transfer_to_account_id").references(() => accounts.id),
  importSource: text("import_source"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const transactionTags = sqliteTable("transaction_tags", {
  transactionId: integer("transaction_id").notNull().references(() => transactions.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
}, (table) => [
  primaryKey({ columns: [table.transactionId, table.tagId] }),
]);

export const recurringRules = sqliteTable("recurring_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityId: integer("entity_id").notNull().references(() => entities.id),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  categoryId: integer("category_id").references(() => categories.id),
  type: text("type", { enum: ["income", "expense"] }).notNull(),
  amount: real("amount").notNull(),
  payee: text("payee"),
  description: text("description"),
  frequency: text("frequency", { enum: ["weekly", "biweekly", "monthly", "quarterly", "annual"] }).notNull(),
  startDate: text("start_date").notNull(),
  nextDueDate: text("next_due_date").notNull(),
  endDate: text("end_date"),
  autoCreate: integer("auto_create").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
});

export const budgets = sqliteTable("budgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityId: integer("entity_id").notNull().references(() => entities.id),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  budgetedAmount: real("budgeted_amount").notNull(),
}, (table) => [
  uniqueIndex("budget_unique").on(table.entityId, table.categoryId, table.year, table.month),
]);

export const imports = sqliteTable("imports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityId: integer("entity_id").notNull().references(() => entities.id),
  filename: text("filename").notNull(),
  fileType: text("file_type", { enum: ["bank_statement", "credit_card", "invoice", "service_bill"] }).notNull(),
  status: text("status", { enum: ["pending", "processed", "error"] }).notNull(),
  rawText: text("raw_text"),
  parsedData: text("parsed_data"),
  transactionsCreated: integer("transactions_created").default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
