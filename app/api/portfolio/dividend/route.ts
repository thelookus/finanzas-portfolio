import { NextRequest, NextResponse } from "next/server";
import { addDividend } from "@/lib/portfolio";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, ticker, amount } = body;

    if (!date || !ticker || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: date, ticker, amount" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "amount must be a positive number" },
        { status: 400 }
      );
    }

    const dividend = {
      date,
      ticker: ticker.toUpperCase(),
      amount: Number(amount),
    };

    const portfolio = addDividend(dividend);
    return NextResponse.json(portfolio);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add dividend" },
      { status: 500 }
    );
  }
}
