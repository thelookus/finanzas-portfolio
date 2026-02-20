import { NextResponse } from "next/server";
import { getUsageSummary } from "@/lib/ai-usage";

export async function GET() {
  try {
    const summary = getUsageSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error getting usage:", error);
    return NextResponse.json(
      { error: "Error obteniendo uso" },
      { status: 500 }
    );
  }
}
