import { db } from "./index";
import { categories, portfolioTransactions, portfolioDividends, watchlistItems, portfolioTickerMeta } from "./schema";
import fs from "fs";
import path from "path";

interface CategorySeed {
  name: string;
  type: "expense" | "income" | "transfer";
  icon: string;
  subcategories?: string[];
}

const personalCategories: CategorySeed[] = [
  { name: "Vivienda", type: "expense", icon: "House", subcategories: ["Alquiler/Hipoteca", "Expensas", "Mantenimiento"] },
  { name: "Transporte", type: "expense", icon: "Car", subcategories: ["Combustible", "Transporte publico", "Estacionamiento", "Mantenimiento auto"] },
  { name: "Alimentacion", type: "expense", icon: "ForkKnife", subcategories: ["Supermercado", "Restaurantes", "Delivery", "Cafe"] },
  { name: "Servicios", type: "expense", icon: "Lightning", subcategories: ["Luz", "Gas", "Agua", "Internet", "Celular", "Streaming"] },
  { name: "Salud", type: "expense", icon: "FirstAid", subcategories: ["Prepaga", "Medico", "Farmacia", "Dental"] },
  { name: "Personal", type: "expense", icon: "User", subcategories: ["Ropa", "Peluqueria", "Gym", "Suscripciones"] },
  { name: "Entretenimiento", type: "expense", icon: "GameController", subcategories: ["Salidas", "Hobbies", "Viajes", "Juegos"] },
  { name: "Educacion", type: "expense", icon: "GraduationCap", subcategories: ["Cursos", "Libros", "Capacitacion"] },
  { name: "Financiero", type: "expense", icon: "Bank", subcategories: ["Ahorro", "Inversiones", "Cuotas de prestamos", "Comisiones"] },
  { name: "Ingresos", type: "income", icon: "Money", subcategories: ["Sueldo", "Freelance", "Inversiones", "Extras"] },
  { name: "Transferencias", type: "transfer", icon: "ArrowsLeftRight" },
];

const businessCategories: CategorySeed[] = [
  { name: "Costo de ventas", type: "expense", icon: "Package", subcategories: ["Materiales", "Mano de obra directa"] },
  { name: "Marketing", type: "expense", icon: "Megaphone", subcategories: ["Publicidad", "Redes sociales", "Diseno"] },
  { name: "Oficina", type: "expense", icon: "Desktop", subcategories: ["Insumos", "Software", "Equipamiento"] },
  { name: "Servicios profesionales", type: "expense", icon: "Briefcase", subcategories: ["Contable", "Legal", "Consultoria"] },
  { name: "Viajes de negocio", type: "expense", icon: "Airplane", subcategories: ["Pasajes", "Alojamiento", "Comidas de trabajo"] },
  { name: "Nomina", type: "expense", icon: "Users", subcategories: ["Sueldos", "Cargas sociales"] },
  { name: "Impuestos", type: "expense", icon: "Receipt", subcategories: ["IVA", "Ganancias", "Ingresos brutos", "Monotributo"] },
  { name: "Ingresos", type: "income", icon: "CurrencyDollar", subcategories: ["Facturacion", "Intereses", "Otros ingresos"] },
  { name: "Transferencias", type: "transfer", icon: "ArrowsLeftRight" },
];

export async function seedCategories(entityId: number, entityType: "personal" | "business") {
  const categoryList = entityType === "personal" ? personalCategories : businessCategories;

  for (let i = 0; i < categoryList.length; i++) {
    const cat = categoryList[i];
    const [parent] = await db.insert(categories).values({
      entityId,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      sortOrder: i,
    }).returning();

    if (cat.subcategories) {
      for (let j = 0; j < cat.subcategories.length; j++) {
        await db.insert(categories).values({
          entityId,
          name: cat.subcategories[j],
          parentId: parent.id,
          type: cat.type,
          icon: cat.icon,
          sortOrder: j,
        });
      }
    }
  }
}

export async function migratePortfolioFromJson(userId: string) {
  const portfolioPath = path.join(process.cwd(), "data", "portfolio.json");
  const watchlistPath = path.join(process.cwd(), "data", "watchlist.json");

  // Migrate portfolio
  if (fs.existsSync(portfolioPath)) {
    const data = JSON.parse(fs.readFileSync(portfolioPath, "utf-8"));

    for (const holding of data.holdings || []) {
      // Insert ticker meta
      await db.insert(portfolioTickerMeta).values({
        userId,
        ticker: holding.ticker,
        sector: holding.sector || "Unknown",
      }).onConflictDoNothing();

      // Insert transactions
      for (const tx of holding.transactions || []) {
        await db.insert(portfolioTransactions).values({
          userId,
          ticker: tx.ticker || holding.ticker,
          date: tx.date,
          shares: tx.shares,
          pricePerShare: tx.pricePerShare,
          costUsd: tx.costUsd,
        });
      }
    }

    // Insert dividends
    for (const div of data.dividends || []) {
      await db.insert(portfolioDividends).values({
        userId,
        ticker: div.ticker,
        date: div.date,
        amount: div.amount,
      });
    }

    console.log(`Migrated portfolio: ${data.holdings?.length || 0} holdings, ${data.dividends?.length || 0} dividends`);
  }

  // Migrate watchlist
  if (fs.existsSync(watchlistPath)) {
    const items = JSON.parse(fs.readFileSync(watchlistPath, "utf-8"));

    for (const item of items) {
      await db.insert(watchlistItems).values({
        userId,
        ticker: item.ticker,
        notes: item.notes || null,
        addedAt: item.addedAt || new Date().toISOString(),
      }).onConflictDoNothing();
    }

    console.log(`Migrated watchlist: ${items.length} items`);
  }
}
