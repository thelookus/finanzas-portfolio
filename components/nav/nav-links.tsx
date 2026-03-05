"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ChartPie,
  TrendUp,
  Binoculars,
  Sparkle,
  CalendarDots,
  Wallet,
  Receipt,
  ChartBar,
  ClockCounterClockwise,
  Bank,
  Tag,
  Gear,
} from "@phosphor-icons/react";
import { type Icon } from "@phosphor-icons/react";
import { OpportunityBadge } from "@/components/nav/opportunity-badge";
import { useModules } from "@/lib/contexts/module-context";
import { cn } from "@/lib/utils";
import type { ModuleId } from "@/lib/modules";

interface NavItem {
  href: string;
  labelKey: string;
  icon: Icon;
  module?: ModuleId;
  badge?: React.ComponentType;
}

const navItems: NavItem[] = [
  // Portfolio module
  { href: "/", labelKey: "dashboard", icon: ChartPie, module: "portfolio" },
  { href: "/opportunities", labelKey: "opportunities", icon: TrendUp, module: "portfolio", badge: OpportunityBadge },
  { href: "/watchlist", labelKey: "watchlist", icon: Binoculars, module: "portfolio" },
  { href: "/ai-discovery", labelKey: "discovery", icon: Sparkle, module: "portfolio" },
  { href: "/dca-planner", labelKey: "dcaPlanner", icon: CalendarDots, module: "portfolio" },
  // Finances module
  { href: "/finances", labelKey: "finances", icon: Wallet, module: "finances" },
  { href: "/finances/transactions", labelKey: "transactions", icon: Receipt, module: "finances" },
  { href: "/finances/budgets", labelKey: "budgets", icon: ChartBar, module: "finances" },
  { href: "/finances/accounts", labelKey: "accounts", icon: Bank, module: "finances" },
  { href: "/finances/categories", labelKey: "categories", icon: Tag, module: "finances" },
  { href: "/finances/bills", labelKey: "bills", icon: ClockCounterClockwise, module: "finances" },
  // Settings (always visible)
  { href: "/settings", labelKey: "settings", icon: Gear },
];

export function DesktopNavLinks() {
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const { enabledModules } = useModules();

  const filteredItems = navItems.filter(
    (item) => !item.module || enabledModules.includes(item.module)
  );

  // Group items by module
  const portfolioItems = filteredItems.filter((i) => i.module === "portfolio");
  const financeItems = filteredItems.filter((i) => i.module === "finances");
  const otherItems = filteredItems.filter((i) => !i.module);

  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {portfolioItems.length > 0 && (
        <>
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("portfolioSection")}
          </p>
          {portfolioItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} t={t} />
          ))}
        </>
      )}
      {financeItems.length > 0 && (
        <>
          <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("financesSection")}
          </p>
          {financeItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} t={t} />
          ))}
        </>
      )}
      {otherItems.length > 0 && (
        <>
          <div className="my-2 border-t border-border" />
          {otherItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} t={t} />
          ))}
        </>
      )}
    </nav>
  );
}

function NavLink({
  item,
  pathname,
  t,
}: {
  item: NavItem;
  pathname: string;
  t: ReturnType<typeof useTranslations<"Nav">>;
}) {
  const isActive =
    item.href === "/"
      ? pathname === "/"
      : item.href === "/finances"
      ? pathname === "/finances"
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
        isActive
          ? "bg-accent text-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <item.icon size={20} weight={isActive ? "fill" : "regular"} />
      {t(item.labelKey)}
      {item.badge && <item.badge />}
    </Link>
  );
}

export function MobileNavLinks() {
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const { enabledModules } = useModules();

  // Show main items for mobile (max 5)
  const mobileItems: NavItem[] = [];
  if (enabledModules.includes("portfolio")) {
    mobileItems.push(navItems[0]); // Dashboard
    mobileItems.push(navItems[1]); // Opportunities
  }
  if (enabledModules.includes("finances")) {
    mobileItems.push(navItems[5]); // Finances
    mobileItems.push(navItems[6]); // Transactions
  }
  mobileItems.push({ href: "/settings", labelKey: "settings", icon: Gear });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card">
      {mobileItems.slice(0, 5).map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : item.href === "/finances"
            ? pathname === "/finances"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors relative",
              isActive
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="relative">
              <item.icon size={20} weight={isActive ? "fill" : "regular"} />
              {item.badge && (
                <span className="absolute -top-1 -right-2.5">
                  <item.badge />
                </span>
              )}
            </span>
            {t(item.labelKey)}
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
