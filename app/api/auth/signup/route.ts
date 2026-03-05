import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { users, userSettings, entities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { seedCategories } from "@/lib/db/seed";
import { createAccount } from "@/lib/finances";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing) {
      return NextResponse.json({ error: "Este email ya esta registrado" }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const passwordHash = await hash(password, 12);

    await db.insert(users).values({ id, name, email, passwordHash });
    await db.insert(userSettings).values({ userId: id });

    // Create default personal entity
    const [entity] = await db.insert(entities).values({
      userId: id,
      name: "Personal",
      type: "personal",
      currency: "ARS",
    }).returning();

    // Update default entity
    await db.update(userSettings).set({ defaultEntityId: entity.id }).where(eq(userSettings.userId, id));

    // Seed default categories
    await seedCategories(entity.id, "personal");

    // Seed default accounts
    await Promise.all([
      createAccount(entity.id, { name: "Efectivo", type: "cash" }),
      createAccount(entity.id, { name: "Cuenta Bancaria", type: "checking" }),
      createAccount(entity.id, { name: "Tarjeta de Crédito", type: "credit" }),
    ]);

    return NextResponse.json({ success: true, userId: id });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Error al crear la cuenta" }, { status: 500 });
  }
}
