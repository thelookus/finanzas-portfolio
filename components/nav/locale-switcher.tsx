"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GlobeSimple } from "@phosphor-icons/react";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  function toggle() {
    const next = locale === "es-AR" ? "en" : "es-AR";
    document.cookie = `locale=${next};path=/;max-age=31536000`;
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="w-full justify-start gap-3 px-3"
    >
      <GlobeSimple size={20} />
      {locale === "es-AR" ? "English" : "Español"}
    </Button>
  );
}
