import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCategories, createCategory, updateCategory, deleteCategory, getEntityById } from "@/lib/finances";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entityId = Number(request.nextUrl.searchParams.get("entityId"));
  if (!entityId) return NextResponse.json({ error: "entityId required" }, { status: 400 });

  const entity = await getEntityById(entityId, session.user.id);
  if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await getCategories(entityId);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const entity = await getEntityById(body.entityId, session.user.id);
    if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const category = await createCategory(body.entityId, body);
    return NextResponse.json(category);
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const category = await updateCategory(body.id, body);
    return NextResponse.json(category);
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = Number(request.nextUrl.searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await deleteCategory(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "CATEGORY_IN_USE") {
      return NextResponse.json({ error: "CATEGORY_IN_USE" }, { status: 409 });
    }
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
