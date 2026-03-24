import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { LineChartIcon } from "lucide-react";

const MonthlySalesChart = ({ data = [], loading = false }) => {
  const isEmpty = !data.length;
  const isSinglePoint = data.length === 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-5 shadow-sm sm:p-6">
      <div className="mb-4 h-1.5 w-28 rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />
      <div className="flex items-center gap-2 mb-4">
        <LineChartIcon className="w-5 h-5 text-slate-700" />
        <h3 className="text-lg font-semibold text-slate-800">
          Monthly Sales
        </h3>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-[350px] text-gray-500 gap-2">
          <LineChartIcon className="w-10 h-10 opacity-40 animate-pulse" />
          <p>Loading chart...</p>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center h-[350px] text-gray-500 gap-2">
          <LineChartIcon className="w-10 h-10 opacity-40" />
          <p>No monthly sales data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={data}
            margin={{ top: 24, right: 16, left: 24, bottom: 16 }}
            barCategoryGap={isSinglePoint ? "88%" : "35%"}
          >
            <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#475569" tickLine={false} axisLine={false} />
            <YAxis stroke="#475569" width={56} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
              }}
            />
            <Bar
              dataKey="total"
              fill="#ea580c"
              maxBarSize={isSinglePoint ? 110 : 48}
              barSize={isSinglePoint ? 110 : undefined}
              radius={[10, 10, 4, 4]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default MonthlySalesChart;
