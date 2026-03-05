import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getEnabledModules, toggleModule } from "@/lib/modules-server";
import type { ModuleId } from "@/lib/modules";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id))
    .limit(1);

  if (!settings) {
    return NextResponse.json({ enabledModules: ["portfolio", "finances"], locale: "es-AR" });
  }

  return NextResponse.json({
    enabledModules: JSON.parse(settings.enabledModules),
    locale: settings.locale,
    defaultEntityId: settings.defaultEntityId,
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Toggle module
  if (body.moduleId && typeof body.enabled === "boolean") {
    const updated = await toggleModule(session.user.id, body.moduleId as ModuleId, body.enabled);
    return NextResponse.json({ enabledModules: updated });
  }

  // Update other settings
  const updates: Record<string, unknown> = {};
  if (body.locale) updates.locale = body.locale;
  if (body.defaultEntityId) updates.defaultEntityId = body.defaultEntityId;

  if (Object.keys(updates).length > 0) {
    await db
      .update(userSettings)
      .set(updates)
      .where(eq(userSettings.userId, session.user.id));
  }

  const modules = await getEnabledModules(session.user.id);
  return NextResponse.json({ enabledModules: modules });
}
