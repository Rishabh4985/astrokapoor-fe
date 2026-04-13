import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { BarChart3 } from "lucide-react";

const STATUS_COLOR_MAP = {
  "consultation done": "#7c3aed",
  paid: "#16a34a",
  refunded: "#dc2626",
  pending: "#f59e0b",
};

const FALLBACK_STATUS_COLORS = [
  "#2563eb",
  "#06b6d4",
  "#ec4899",
  "#4f46e5",
  "#14b8a6",
  "#f97316",
  "#65a30d",
  "#0ea5e9",
  "#be123c",
  "#a21caf",
];

const normalizeStatusKey = (name = "") =>
  name
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const getStatusColor = (name = "", fallbackIndex = 0) => {
  const key = normalizeStatusKey(name);

  if (key in STATUS_COLOR_MAP) return STATUS_COLOR_MAP[key];

  return FALLBACK_STATUS_COLORS[fallbackIndex % FALLBACK_STATUS_COLORS.length];
};

const hexToRgba = (hex, alpha = 1) => {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length !== 6) return `rgba(15, 23, 42, ${alpha})`;

  const r = Number.parseInt(cleanHex.slice(0, 2), 16);
  const g = Number.parseInt(cleanHex.slice(2, 4), 16);
  const b = Number.parseInt(cleanHex.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const StatusChart = ({ data = [], loading = false }) => {
  const normalizedData = useMemo(
    () => {
      let fallbackIndex = 0;

      return (data || [])
        .map((item) => {
          const name = item?.name || "Unknown";
          const value = Number(item?.value) || 0;
          const statusKey = normalizeStatusKey(name);
          const isKnownStatus = statusKey in STATUS_COLOR_MAP;
          const color = getStatusColor(name, fallbackIndex);

          if (!isKnownStatus) fallbackIndex += 1;

          return { name, value, color };
        })
        .filter((item) => item.value > 0);
    },
    [data],
  );

  const total = normalizedData.reduce((sum, item) => sum + item.value, 0);
  const isEmpty = normalizedData.length === 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm sm:p-6">
      <div className="mb-4 h-1.5 w-28 rounded-full bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500" />
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-slate-700" />
        <h3 className="text-lg font-semibold text-slate-800">Status Summary</h3>
      </div>

      {loading ? (
        <div className="flex h-[320px] flex-col items-center justify-center gap-2 text-slate-500">
          <BarChart3 className="h-10 w-10 animate-pulse opacity-40" />
          <p>Loading chart...</p>
        </div>
      ) : isEmpty ? (
        <div className="flex h-[320px] flex-col items-center justify-center gap-2 text-slate-500">
          <BarChart3 className="h-10 w-10 opacity-40" />
          <p>No status data available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="relative h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={normalizedData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={94}
                  paddingAngle={3}
                  cornerRadius={8}
                  stroke="none"
                >
                  {normalizedData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => new Intl.NumberFormat("en-IN").format(Number(value))}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total
                </p>
                <p className="text-2xl font-black text-slate-900">
                  {new Intl.NumberFormat("en-IN").format(total)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 self-center">
            {normalizedData.map((item) => {
              const share = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div
                  key={item.name}
                  className="rounded-xl border bg-white p-3"
                  style={{
                    borderColor: hexToRgba(item.color, 0.3),
                    backgroundColor: hexToRgba(item.color, 0.07),
                  }}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">
                      {item.value}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${share}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusChart;
