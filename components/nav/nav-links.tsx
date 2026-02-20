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
} from "@phosphor-icons/react";
import { type Icon } from "@phosphor-icons/react";
import { OpportunityBadge } from "@/components/nav/opportunity-badge";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  labelKey: string;
  icon: Icon;
}

const navItems: NavItem[] = [
  { href: "/", labelKey: "dashboard", icon: ChartPie },
  { href: "/opportunities", labelKey: "opportunities", icon: TrendUp },
  { href: "/watchlist", labelKey: "watchlist", icon: Binoculars },
  { href: "/ai-discovery", labelKey: "discovery", icon: Sparkle },
  { href: "/dca-planner", labelKey: "dcaPlanner", icon: CalendarDots },
];

export function DesktopNavLinks() {
  const pathname = usePathname();
  const t = useTranslations("Nav");

  return (
    <nav className="flex-1 p-3 space-y-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
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
            {item.href === "/opportunities" && <OpportunityBadge />}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavLinks() {
  const pathname = usePathname();
  const t = useTranslations("Nav");

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-card">
      {navItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

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
              {item.href === "/opportunities" && (
                <span className="absolute -top-1 -right-2.5">
                  <OpportunityBadge />
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
