import Link from "next/link";
import { ListStar } from "@phosphor-icons/react/dist/ssr";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DesktopNavLinks, MobileNavLinks } from "@/components/nav/nav-links";
import { AIUsageFooter } from "@/components/nav/ai-usage-footer";
import { LocaleSwitcher } from "@/components/nav/locale-switcher";
import { ThemeSwitcher } from "@/components/nav/theme-switcher";
import { UserMenu } from "@/components/auth/user-menu";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card">
          <div className="p-4 border-b border-border">
            <Link href="/" className="flex items-center gap-2">
              <ListStar size={24} weight="bold" className="text-primary" />
              <span className="font-semibold text-lg">Finance</span>
            </Link>
          </div>
          <DesktopNavLinks />
          <div className="mt-auto">
            <div className="px-3 py-2 space-y-1">
              <ThemeSwitcher />
              <LocaleSwitcher />
            </div>
            <AIUsageFooter />
            <UserMenu />
          </div>
        </aside>
        <MobileNavLinks />
        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
}
