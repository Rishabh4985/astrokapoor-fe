import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChartIcon } from "lucide-react";

const COLORS = {
  sales: "#06b6d4",
  refunds: "#f43f5e",
};

const SalesVsRefundChart = ({ data = [], loading = false }) => {
  const { sales, refunds } = useMemo(() => {
    return (data || []).reduce(
      (acc, item) => {
        const key = (item?.name || "").toString().toLowerCase();
        const value = Number(item?.value) || 0;
        if (key === "refunds") acc.refunds += value;
        if (key === "sales") acc.sales += value;
        return acc;
      },
      { sales: 0, refunds: 0 },
    );
  }, [data]);

  const total = sales + refunds;
  const chartData =
    total > 0
      ? [
          { name: "Sales", value: sales, color: COLORS.sales },
          { name: "Refunds", value: refunds, color: COLORS.refunds },
        ].filter((item) => item.value > 0)
      : [];

  const isEmpty = total <= 0;
  const salesPct = total > 0 ? Math.round((sales / total) * 100) : 0;
  const refundsPct = total > 0 ? Math.round((refunds / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm sm:p-6">
      <div className="mb-4 h-1.5 w-28 rounded-full bg-gradient-to-r from-cyan-400 to-rose-500" />
      <div className="mb-4 flex items-center gap-2">
        <PieChartIcon className="h-5 w-5 text-slate-700" />
        <h3 className="text-lg font-semibold text-slate-800">Sales vs Refund</h3>
      </div>

      {loading ? (
        <div className="flex h-[320px] flex-col items-center justify-center gap-2 text-slate-500">
          <PieChartIcon className="h-10 w-10 animate-pulse opacity-40" />
          <p>Loading chart...</p>
        </div>
      ) : isEmpty ? (
        <div className="flex h-[320px] flex-col items-center justify-center gap-2 text-slate-500">
          <PieChartIcon className="h-10 w-10 opacity-40" />
          <p>No sales/refund data available</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={66}
                  outerRadius={96}
                  paddingAngle={4}
                  cornerRadius={10}
                  stroke="none"
                >
                  {chartData.map((entry) => (
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

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                Sales
              </p>
              <p className="text-xl font-bold text-cyan-800">
                {new Intl.NumberFormat("en-IN").format(sales)}
              </p>
              <p className="text-xs text-cyan-700/80">{salesPct}% share</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                Refunds
              </p>
              <p className="text-xl font-bold text-rose-800">
                {new Intl.NumberFormat("en-IN").format(refunds)}
              </p>
              <p className="text-xs text-rose-700/80">{refundsPct}% share</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesVsRefundChart;
