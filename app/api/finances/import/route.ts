import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEntityById, getCategories, getAccounts } from "@/lib/finances";
import { extractTextFromPDF, parseCSV, analyzeDocument } from "@/lib/import-parser";
import type { AccountType, DocumentType } from "@/lib/import-parser";
import { db } from "@/lib/db";
import { imports } from "@/lib/db/schema";

interface CategoryRecord {
  id: number;
  name: string;
}

interface AccountRecord {
  id: number;
  name: string;
  type: string;
  isArchived: number;
}

function matchCategory(suggestedName: string | undefined, categories: CategoryRecord[]): number | null {
  if (!suggestedName) return null;
  const lower = suggestedName.toLowerCase();

  // Exact match
  const exact = categories.find((c) => c.name.toLowerCase() === lower);
  if (exact) return exact.id;

  // Partial match (substring)
  const partial = categories.find(
    (c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase())
  );
  if (partial) return partial.id;

  return null;
}

const accountTypeMap: Record<string, string> = {
  credit_card: "credit",
  bank_statement: "checking",
  invoice: "checking",
  service_bill: "checking",
};

function matchAccount(suggestedType: AccountType | undefined, documentType: DocumentType, allAccounts: AccountRecord[]): number | null {
  const activeAccounts = allAccounts.filter((a) => !a.isArchived);
  if (activeAccounts.length === 0) return null;

  // Try matching by suggested account type
  if (suggestedType) {
    const byType = activeAccounts.find((a) => a.type === suggestedType);
    if (byType) return byType.id;
  }

  // Try matching by document type
  const mappedType = accountTypeMap[documentType];
  if (mappedType) {
    const byDocType = activeAccounts.find((a) => a.type === mappedType);
    if (byDocType) return byDocType.id;
  }

  // Fallback to first active account
  return activeAccounts[0].id;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const entityId = Number(formData.get("entityId"));

    if (!file || !entityId) {
      return NextResponse.json({ error: "file and entityId required" }, { status: 400 });
    }

    const entity = await getEntityById(entityId, session.user.id);
    if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = file.name;
    const isPDF = filename.toLowerCase().endsWith(".pdf");
    const isCSV = filename.toLowerCase().endsWith(".csv");

    // Fetch categories and accounts for AI matching
    const [userCategories, userAccounts] = await Promise.all([
      getCategories(entityId),
      getAccounts(entityId),
    ]);

    const categoryNames = userCategories.map((c) => c.name);

    let rawText: string;
    let parsedTransactions;
    let documentType: DocumentType = "bank_statement";
    let suggestedAccountId: number | null = null;

    if (isPDF) {
      rawText = await extractTextFromPDF(buffer);
      const analysis = await analyzeDocument(rawText, categoryNames);
      documentType = analysis.documentType;

      // Match categories for each transaction
      parsedTransactions = analysis.transactions.map((tx) => ({
        ...tx,
        suggestedCategoryId: matchCategory(tx.suggestedCategory, userCategories),
      }));

      // Match account
      suggestedAccountId = matchAccount(analysis.suggestedAccountType, documentType, userAccounts);
    } else if (isCSV) {
      rawText = buffer.toString("utf-8");
      parsedTransactions = parseCSV(rawText).map((tx) => ({
        ...tx,
        suggestedCategoryId: null as number | null,
      }));
      suggestedAccountId = userAccounts.filter((a) => !a.isArchived)[0]?.id ?? null;
    } else {
      return NextResponse.json({ error: "Formato no soportado. Usa PDF o CSV." }, { status: 400 });
    }

    if (parsedTransactions.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron transacciones en el archivo." },
        { status: 422 }
      );
    }

    // Save import record
    const [importRecord] = await db.insert(imports).values({
      entityId,
      filename,
      fileType: documentType,
      status: "processed",
      rawText: rawText.substring(0, 10000),
      parsedData: JSON.stringify(parsedTransactions),
      transactionsCreated: 0,
    }).returning();

    return NextResponse.json({
      importId: importRecord.id,
      transactions: parsedTransactions,
      filename,
      documentType,
      suggestedAccountId,
      accounts: userAccounts.filter((a) => !a.isArchived),
      categories: userCategories,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Error al importar archivo" }, { status: 500 });
  }
}
