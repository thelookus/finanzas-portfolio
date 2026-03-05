import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBudgets, upsertBudget, getEntityById } from "@/lib/finances";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const entityId = Number(sp.get("entityId"));
  const year = Number(sp.get("year"));
  const month = Number(sp.get("month"));

  if (!entityId || !year || !month) {
    return NextResponse.json({ error: "entityId, year, month required" }, { status: 400 });
  }

  const entity = await getEntityById(entityId, session.user.id);
  if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await getBudgets(entityId, year, month);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const entity = await getEntityById(body.entityId, session.user.id);
    if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const budget = await upsertBudget(body.entityId, body.categoryId, body.year, body.month, body.budgetedAmount);
    return NextResponse.json(budget);
  } catch (error) {
    console.error("Upsert budget error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
