import React, { useState, useEffect, useContext, useMemo } from "react";
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
import { AuthContext } from "../../context/AuthContext";
import { filterRecords, groupMonthly } from "./utils";
const API_URL = import.meta.env.DEV
  ? "http://localhost:4000/api"
  : import.meta.env.VITE_API_URL;

const MonthlySalesChart = ({ filter = "all", category = "all" }) => {
  const { authToken, userRole } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authToken || !userRole) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API_URL}/${userRole}/charts/records`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch records");
        return res.json();
      })
      .then((data) => {
        setRecords(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [authToken, userRole]);

  const filteredAndGrouped = useMemo(() => {
    const filtered = filterRecords(records, filter, category);
    return groupMonthly(filtered);
  }, [records, filter, category]);

  if (loading) return <div>Loading Monthly Sales Chart...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl shadow-md p-4 sm:p-6 mb-6 w-full">
      <div className="flex items-center gap-2 mb-4">
        <LineChartIcon className="w-5 h-5 text-orange-700" />
        <h3 className="text-lg sm:text-xl font-semibold text-orange-800 italic">
          Monthly Sales
        </h3>
      </div>

      {filteredAndGrouped.length === 0 ? (
        <div className="h-[350px] flex items-center justify-center text-gray-400 italic">
          No sales data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={filteredAndGrouped}
            margin={{ top: 10, right: 10, bottom: 10, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#fcd9a4" />
            <XAxis dataKey="name" stroke="#92400e" />
            <YAxis stroke="#92400e" domain={[0, "dataMax"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff7ed",
                borderColor: "#fb923c",
              }}
              cursor={{ fill: "rgba(251, 146, 60, 0.2)" }}
            />
            <Bar dataKey="total" fill="#ea580c" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default MonthlySalesChart;
