"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { HoldingWithQuote } from "@/types";

interface AllocationChartProps {
  holdings: HoldingWithQuote[];
}

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#6366f1",
  "#14b8a6",
];

export function AllocationChart({ holdings }: AllocationChartProps) {
  const data = holdings.map((h) => ({
    name: h.ticker,
    value: h.currentValue,
    weight: h.weight,
  }));

  return (
    <>
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            dataKey="value"
            nameKey="name"
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-card border border-border rounded-md p-2 text-sm shadow-lg">
                  <p className="font-medium">{d.name}</p>
                  <p className="text-muted-foreground">
                    ${d.value.toFixed(2)} ({d.weight.toFixed(1)}%)
                  </p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="flex flex-wrap gap-3 justify-center mt-2">
      {data.map((d, i) => (
        <div key={d.name} className="flex items-center gap-1.5 text-xs">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: COLORS[i % COLORS.length] }}
          />
          <span className="text-muted-foreground">
            {d.name} ({d.weight.toFixed(1)}%)
          </span>
        </div>
      ))}
    </div>
    </>
  );
}
