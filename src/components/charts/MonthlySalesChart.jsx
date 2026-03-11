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

const MonthlySalesChart = ({ data = [] }) => {
  if (!data.length)
    return <div className="p-6">No monthly sales data available</div>;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl shadow-md p-6">
      <div className="flex items-center gap-2 mb-4">
        <LineChartIcon className="w-5 h-5 text-orange-700" />
        <h3 className="text-lg font-semibold text-orange-800 italic">
          Monthly Sales
        </h3>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#fcd9a4" />
          <XAxis dataKey="name" stroke="#92400e" />
          <YAxis stroke="#92400e" width={60} />
          <Tooltip />
          <Bar dataKey="total" fill="#ea580c" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlySalesChart;
