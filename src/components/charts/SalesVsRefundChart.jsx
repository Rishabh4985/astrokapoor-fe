import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PieChartIcon } from "lucide-react";

const COLORS = ["#16a34a", "#ea580c"];

const SalesVsRefundChart = ({ data }) => {
  const isEmpty =
    !data || data.length === 0 || data.every((entry) => entry.value === 0);

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl shadow-md p-4 sm:p-6 mb-6 w-full">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon className="w-5 h-5 text-orange-700" />
        <h3 className="text-lg sm:text-xl font-semibold text-orange-800 italic">
          Sales vs Refund
        </h3>
      </div>

      {isEmpty ? (
        <div className="h-[300px] flex items-center justify-center text-gray-400 italic">
          No sales data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff7ed",
                borderColor: "#fb923c",
                fontSize: "14px",
              }}
              formatter={(value, name) => [`${value}`, `${name}`]}
            />
            <Legend 
              verticalAlign="bottom" 
              height={40}
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>
                  {value}: {((entry.payload.value / data.reduce((a, b) => a + b.value, 0)) * 100).toFixed(0)}%
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default SalesVsRefundChart;
