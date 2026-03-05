import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAccounts, createAccount, updateAccount, deleteAccount, getEntityById } from "@/lib/finances";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entityId = Number(request.nextUrl.searchParams.get("entityId"));
  if (!entityId) return NextResponse.json({ error: "entityId required" }, { status: 400 });

  const entity = await getEntityById(entityId, session.user.id);
  if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await getAccounts(entityId);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const entity = await getEntityById(body.entityId, session.user.id);
    if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const account = await createAccount(body.entityId, body);
    return NextResponse.json(account);
  } catch (error) {
    console.error("Create account error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const account = await updateAccount(body.id, body);
    return NextResponse.json(account);
  } catch (error) {
    console.error("Update account error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const id = Number(request.nextUrl.searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const account = await deleteAccount(id);
    return NextResponse.json(account);
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
