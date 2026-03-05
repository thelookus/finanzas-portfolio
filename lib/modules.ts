export type ModuleId = "portfolio" | "finances";

export const MODULE_REGISTRY: Record<ModuleId, { labelKey: string; icon: string }> = {
  portfolio: { labelKey: "portfolio", icon: "ChartPie" },
  finances: { labelKey: "finances", icon: "Wallet" },
};
