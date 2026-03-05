import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getEntityById } from "@/lib/finances";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const entityId = Number(sp.get("entityId"));
  if (!entityId) return NextResponse.json({ error: "entityId required" }, { status: 400 });

  const entity = await getEntityById(entityId, session.user.id);
  if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await getTransactions({
    entityId,
    accountId: sp.get("accountId") ? Number(sp.get("accountId")) : undefined,
    categoryId: sp.get("categoryId") ? Number(sp.get("categoryId")) : undefined,
    type: sp.get("type") as "income" | "expense" | "transfer" | undefined,
    dateFrom: sp.get("dateFrom") ?? undefined,
    dateTo: sp.get("dateTo") ?? undefined,
    search: sp.get("search") ?? undefined,
    limit: sp.get("limit") ? Number(sp.get("limit")) : 100,
    offset: sp.get("offset") ? Number(sp.get("offset")) : 0,
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const tx = await createTransaction(body);
    return NextResponse.json(tx);
  } catch (error) {
    console.error("Create transaction error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const tx = await updateTransaction(body.id, body);
    return NextResponse.json(tx);
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number(request.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await deleteTransaction(id);
  return NextResponse.json({ success: true });
}
