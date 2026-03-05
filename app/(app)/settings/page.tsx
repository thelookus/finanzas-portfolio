"use client";

import { useTranslations } from "next-intl";
import { useModules } from "@/lib/contexts/module-context";
import { useTheme } from "@/lib/contexts/theme-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/hooks/use-session";
import { MODULE_REGISTRY, type ModuleId } from "@/lib/modules";
import { ChartPie, Wallet, Sun, Moon } from "@phosphor-icons/react";

const moduleIcons: Record<ModuleId, React.ReactNode> = {
  portfolio: <ChartPie size={20} />,
  finances: <Wallet size={20} />,
};

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const { user } = useCurrentUser();
  const { enabledModules, toggleModule } = useModules();
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("profile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("name")}</span>
            <span>{user?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email}</span>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("appearance")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
              <span className="text-sm font-medium">{t("theme")}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
              >
                {t("lightTheme")}
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
              >
                {t("darkTheme")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("modules")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(Object.keys(MODULE_REGISTRY) as ModuleId[]).map((moduleId) => {
            const isEnabled = enabledModules.includes(moduleId);
            return (
              <div key={moduleId} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  {moduleIcons[moduleId]}
                  <span className="text-sm font-medium">{t(`module_${moduleId}`)}</span>
                </div>
                <Button
                  variant={isEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleModule(moduleId, !isEnabled)}
                >
                  {isEnabled ? t("enabled") : t("disabled")}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
