import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEntities, createEntity } from "@/lib/finances";
import { seedCategories } from "@/lib/db/seed";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getEntities(session.user.id);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const entity = await createEntity(session.user.id, body);
    await seedCategories(entity.id, entity.type);
    return NextResponse.json(entity);
  } catch (error) {
    console.error("Create entity error:", error);
    return NextResponse.json({ error: "Error al crear entidad" }, { status: 500 });
  }
}
