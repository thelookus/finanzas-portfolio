import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getHolding, getPortfolio, addTransaction, deleteTransaction, updateTransaction } from "@/lib/portfolio";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ticker = request.nextUrl.searchParams.get("ticker");

  if (ticker) {
    const holding = await getHolding(session.user.id, ticker);
    if (!holding) {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json(holding);
  }

  const portfolio = await getPortfolio(session.user.id);
  return NextResponse.json(portfolio);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { ticker, date, costUsd, shares, pricePerShare, sector } = body;

    if (!ticker || !date || !costUsd || !shares || !pricePerShare) {
      return NextResponse.json(
        { error: "Missing required fields: ticker, date, costUsd, shares, pricePerShare" },
        { status: 400 }
      );
    }

    if (costUsd <= 0 || shares <= 0 || pricePerShare <= 0) {
      return NextResponse.json(
        { error: "costUsd, shares, and pricePerShare must be positive numbers" },
        { status: 400 }
      );
    }

    const transaction = {
      ticker: ticker.toUpperCase(),
      date,
      costUsd: Number(costUsd),
      shares: Number(shares),
      pricePerShare: Number(pricePerShare),
    };

    const portfolio = await addTransaction(session.user.id, transaction, sector);
    return NextResponse.json(portfolio);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add transaction" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { id, update } = body;

    if (!id || !update) {
      return NextResponse.json(
        { error: "Missing required fields: id, update" },
        { status: 400 }
      );
    }

    const txId = Number(id);
    if (isNaN(txId)) {
      return NextResponse.json(
        { error: "id must be a number" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (update.ticker) updateData.ticker = String(update.ticker).toUpperCase();
    if (update.date) updateData.date = update.date;
    if (update.shares) updateData.shares = Number(update.shares);
    if (update.pricePerShare) updateData.pricePerShare = Number(update.pricePerShare);
    if (update.costUsd) updateData.costUsd = Number(update.costUsd);
    if (update.sector) updateData.sector = update.sector;

    const portfolio = await updateTransaction(session.user.id, txId, updateData);
    return NextResponse.json(portfolio);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const idStr = request.nextUrl.searchParams.get("id");

    if (!idStr) {
      return NextResponse.json(
        { error: "Missing required param: id" },
        { status: 400 }
      );
    }

    const txId = parseInt(idStr, 10);
    if (isNaN(txId)) {
      return NextResponse.json(
        { error: "id must be a number" },
        { status: 400 }
      );
    }

    const portfolio = await deleteTransaction(session.user.id, txId);
    return NextResponse.json(portfolio);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
