"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/lib/hooks/use-session";
import { Button } from "@/components/ui/button";
import { SignOut, User } from "@phosphor-icons/react";

export function UserMenu() {
  const { user } = useCurrentUser();
  const t = useTranslations("Auth");

  if (!user) return null;

  return (
    <div className="border-t border-border px-3 py-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
          {user.name?.charAt(0).toUpperCase() ?? <User size={14} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <SignOut size={16} className="mr-2" />
        {t("logout")}
      </Button>
    </div>
  );
}
