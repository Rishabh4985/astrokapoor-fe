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
import { BarChart3 } from "lucide-react";

const StatusChart = ({ data }) => {
  const isEmpty = !data || data.length === 0;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl shadow-md p-4 sm:p-6 mb-6 w-full overflow-visible">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-orange-700" />
        <h3 className="text-lg sm:text-xl font-semibold text-orange-800 italic">
          Status Summary
        </h3>
      </div>

      {isEmpty ? (
        <div className="h-[350px] flex items-center justify-center text-gray-400 italic">
          No sales data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 0, bottom: 10, left: -17 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#fcd9a4" />
            <XAxis dataKey="name" stroke="#92400e" />
            <YAxis stroke="#92400e" domain={[0, "dataMax"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff7ed",
                borderColor: "#facc15",
                fontSize: "14px",
              }}
              cursor={{ fill: "rgba(250, 204, 21, 0.2)" }}
            />
            <Bar dataKey="value" fill="#facc15" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default StatusChart;
