import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWatchlist, addWatchlistItem, removeWatchlistItem } from "@/lib/portfolio";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await getWatchlist(session.user.id);
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { ticker, notes } = body as { ticker: string; notes?: string };

  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }

  try {
    const newItem = await addWatchlistItem(session.user.id, ticker, notes);
    return NextResponse.json(newItem, { status: 201 });
  } catch {
    return NextResponse.json({ error: "already in watchlist" }, { status: 409 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }

  await removeWatchlistItem(session.user.id, ticker);
  return NextResponse.json({ ok: true });
}
