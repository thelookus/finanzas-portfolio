import { NextRequest, NextResponse } from "next/server";
import { getHolding, getPortfolio, addTransaction, deleteTransaction } from "@/lib/portfolio";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");

  if (ticker) {
    const holding = getHolding(ticker);
    if (!holding) {
      return NextResponse.json(null, { status: 404 });
    }
    return NextResponse.json(holding);
  }

  const portfolio = getPortfolio();
  return NextResponse.json(portfolio);
}

export async function POST(request: NextRequest) {
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

    const portfolio = addTransaction(transaction, sector);
    return NextResponse.json(portfolio);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ticker = request.nextUrl.searchParams.get("ticker");
    const indexStr = request.nextUrl.searchParams.get("index");

    if (!ticker || indexStr === null) {
      return NextResponse.json(
        { error: "Missing required params: ticker, index" },
        { status: 400 }
      );
    }

    const index = parseInt(indexStr, 10);
    if (isNaN(index)) {
      return NextResponse.json(
        { error: "index must be a number" },
        { status: 400 }
      );
    }

    const portfolio = deleteTransaction(ticker, index);
    return NextResponse.json(portfolio);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
