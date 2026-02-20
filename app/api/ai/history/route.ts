import { NextRequest, NextResponse } from "next/server";
import {
  getAIHistory,
  getAIHistoryByType,
  getAIHistoryByTicker,
  addAIHistoryEntry,
  deleteAIHistoryEntry,
} from "@/lib/ai-history";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as "advisor" | "analysis" | "discovery" | "dca" | null;
  const ticker = searchParams.get("ticker");

  if (ticker) {
    return NextResponse.json(getAIHistoryByTicker(ticker));
  }
  if (type) {
    return NextResponse.json(getAIHistoryByType(type));
  }
  return NextResponse.json(getAIHistory());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, content, metadata } = body;

    if (!type || !content) {
      return NextResponse.json(
        { error: "type y content son requeridos" },
        { status: 400 }
      );
    }

    const entry = addAIHistoryEntry({ type, content, metadata: metadata || {} });
    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error saving AI history:", error);
    return NextResponse.json(
      { error: "Error guardando historial" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id requerido" }, { status: 400 });
  }

  const deleted = deleteAIHistoryEntry(id);
  if (!deleted) {
    return NextResponse.json({ error: "Entry no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
