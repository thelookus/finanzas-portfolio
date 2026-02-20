import { NextRequest, NextResponse } from "next/server";
import { getWatchlist, saveWatchlist } from "@/lib/portfolio";
import { WatchlistItem } from "@/types";

export async function GET() {
  const items = getWatchlist();
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { ticker, notes } = body as { ticker: string; notes?: string };

  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }

  const items = getWatchlist();
  const exists = items.find(
    (i) => i.ticker.toUpperCase() === ticker.toUpperCase()
  );
  if (exists) {
    return NextResponse.json({ error: "already in watchlist" }, { status: 409 });
  }

  const newItem: WatchlistItem = {
    ticker: ticker.toUpperCase(),
    addedAt: new Date().toISOString(),
    notes,
  };
  items.push(newItem);
  saveWatchlist(items);

  return NextResponse.json(newItem, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }

  const items = getWatchlist();
  const filtered = items.filter(
    (i) => i.ticker.toUpperCase() !== ticker.toUpperCase()
  );
  saveWatchlist(filtered);

  return NextResponse.json({ ok: true });
}
