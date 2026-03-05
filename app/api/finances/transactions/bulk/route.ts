import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { bulkUpdateTransactions, bulkDeleteTransactions } from "@/lib/finances";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { ids, update } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }

    if (!update || (!update.categoryId && !update.accountId)) {
      return NextResponse.json({ error: "update data required" }, { status: 400 });
    }

    await bulkUpdateTransactions(ids, update);
    return NextResponse.json({ ok: true, updated: ids.length });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json({ error: "Error updating transactions" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }

    await bulkDeleteTransactions(ids);
    return NextResponse.json({ ok: true, deleted: ids.length });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ error: "Error deleting transactions" }, { status: 500 });
  }
}
