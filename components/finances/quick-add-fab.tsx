"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TransactionForm } from "./transaction-form";
import { Plus } from "@phosphor-icons/react";

export function QuickAddFAB({ externalOpen, onExternalOpenChange }: { externalOpen?: boolean; onExternalOpenChange?: (open: boolean) => void } = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = (v: boolean) => { setInternalOpen(v); onExternalOpenChange?.(v); };
  const t = useTranslations("Finances");

  return (
    <>
      <Button
        className="md:hidden fixed right-4 bottom-20 z-40 h-14 w-14 rounded-full shadow-lg"
        size="icon"
        onClick={() => setOpen(true)}
      >
        <Plus size={24} weight="bold" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen} modal={false}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle>{t("addTransaction")}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 px-6 pb-6 overflow-y-auto">
            <TransactionForm
              onSuccess={() => {
                setOpen(false);
                window.location.reload();
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
