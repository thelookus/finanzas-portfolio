import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ModuleId } from "./modules";

export async function getEnabledModules(userId: string): Promise<ModuleId[]> {
  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  if (!settings) return ["portfolio", "finances"];

  try {
    return JSON.parse(settings.enabledModules) as ModuleId[];
  } catch {
    return ["portfolio", "finances"];
  }
}

export async function toggleModule(userId: string, moduleId: ModuleId, enabled: boolean) {
  const current = await getEnabledModules(userId);
  let updated: ModuleId[];

  if (enabled) {
    updated = current.includes(moduleId) ? current : [...current, moduleId];
  } else {
    updated = current.filter((m) => m !== moduleId);
    if (updated.length === 0) updated = [moduleId];
  }

  await db
    .update(userSettings)
    .set({ enabledModules: JSON.stringify(updated) })
    .where(eq(userSettings.userId, userId));

  return updated;
}
