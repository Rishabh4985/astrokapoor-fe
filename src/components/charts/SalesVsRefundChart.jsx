import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PieChartIcon } from "lucide-react";

const COLORS = ["#16a34a", "#ea580c"];

const SalesVsRefundChart = ({ data = [] }) => {
  const isEmpty = !data.length || data.every((d) => d.value === 0);

  if (isEmpty)
    return <div className="p-6">No sales vs refund data available</div>;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon className="w-5 h-5 text-orange-700" />
        <h3 className="text-lg font-semibold text-orange-800 italic">
          Sales vs Refund
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} dataKey="value" outerRadius={80}>
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesVsRefundChart;
