"use client";

import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { HoldingWithQuote } from "@/types";

interface PnLChartProps {
  holdings: HoldingWithQuote[];
  totalInvested: number;
}

export function PnLChart({ holdings, totalInvested }: PnLChartProps) {
  const t = useTranslations("PnLChart");
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalPnL = totalValue - totalInvested;

  // Build per-holding P&L data for the chart
  const data = holdings.map((h) => ({
    name: h.ticker,
    invested: h.totalInvested,
    value: h.currentValue,
    pnl: h.pnl,
  }));

  // Add total row
  data.push({
    name: "TOTAL",
    invested: totalInvested,
    value: totalValue,
    pnl: totalPnL,
  });

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.slice(0, -1)}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickFormatter={(v) => `$${v.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value?: number, name?: string) => [
              `$${(value ?? 0).toFixed(2)}`,
              name ?? "",
            ]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="invested"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ r: 4 }}
            name={t("invested")}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 4 }}
            name={t("currentValue")}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
