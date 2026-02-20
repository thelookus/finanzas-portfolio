import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { ListStar } from "@phosphor-icons/react/dist/ssr";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DesktopNavLinks, MobileNavLinks } from "@/components/nav/nav-links";
import { AIUsageFooter } from "@/components/nav/ai-usage-footer";
import { LocaleSwitcher } from "@/components/nav/locale-switcher";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finance Dashboard",
  description: "Personal stock portfolio tracker",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <TooltipProvider>
            <div className="flex min-h-screen">
              <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card">
                <div className="p-4 border-b border-border">
                  <Link href="/" className="flex items-center gap-2">
                    <ListStar size={24} weight="bold" className="text-primary" />
                    <span className="font-semibold text-lg">Portfolio</span>
                  </Link>
                </div>
                <DesktopNavLinks />
                <div className="mt-auto">
                  <div className="px-3 py-2">
                    <LocaleSwitcher />
                  </div>
                  <AIUsageFooter />
                </div>
              </aside>
              <MobileNavLinks />
              <main className="flex-1 overflow-auto pb-20 md:pb-0">
                {children}
              </main>
            </div>
          </TooltipProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
