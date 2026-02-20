"use client";

import { useEffect, useState } from "react";

export function OpportunityBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let ignore = false;

    fetch("/api/opportunities")
      .then((r) => r.json())
      .then((data) => {
        if (!ignore) setCount(data.hotCount ?? 0);
      })
      .catch(() => {});

    return () => { ignore = true; };
  }, []);

  if (count === 0) return null;

  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-[10px] font-bold text-white leading-none">
      {count}
    </span>
  );
}
