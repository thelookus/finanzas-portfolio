import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTotalsByCategory, getMonthlyTrend, getEntityById } from "@/lib/finances";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const entityId = Number(sp.get("entityId"));
  const report = sp.get("report"); // "category" | "trend"

  if (!entityId) return NextResponse.json({ error: "entityId required" }, { status: 400 });

  const entity = await getEntityById(entityId, session.user.id);
  if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (report === "trend") {
    const months = Number(sp.get("months")) || 6;
    const result = await getMonthlyTrend(entityId, months);
    return NextResponse.json(result);
  }

  // Default: category breakdown for a month
  const year = Number(sp.get("year")) || new Date().getFullYear();
  const month = Number(sp.get("month")) || new Date().getMonth() + 1;
  const result = await getTotalsByCategory(entityId, year, month);
  return NextResponse.json(result);
}
