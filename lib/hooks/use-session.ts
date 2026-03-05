"use client";

import { useSession as useNextAuthSession } from "next-auth/react";

export function useCurrentUser() {
  const { data: session, status } = useNextAuthSession();
  return {
    user: session?.user ?? null,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
