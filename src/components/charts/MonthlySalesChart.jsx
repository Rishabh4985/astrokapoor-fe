import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
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

const API_URL = import.meta.env.DEV
  ? "http://localhost:4000/api"
  : import.meta.env.VITE_API_URL;

// Cache duration 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

const MonthlySalesChart = () => {
  const { authToken, userRole } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchedRef = useRef(null);

  useEffect(() => {
    if (!authToken || !userRole) {
      setError("Not authenticated");
      setData([]);
      setLoading(false);
      return;
    }

    // Check cache freshness
    const now = Date.now();
    if (lastFetchedRef.current && (now - lastFetchedRef.current < CACHE_DURATION)) {
      // Use cached data; do not fetch
      return;
    }

    setLoading(true);
    setError(null);

    const basePath = `${API_URL}/${userRole}/charts`;

    fetch(`${basePath}/monthly-sales`, {
      headers: { Authorization: `Bearer ${authToken}` },
    }).then((res) => {
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }).then((result) => {
      setData(result);
      lastFetchedRef.current = Date.now();
      setLoading(false);
    }).catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  }, [authToken, userRole]);

  // Memoize sorted data by full array to avoid anomalies
  const sortedData = useMemo(() => {
    if (!data?.length) return [];
    const monthMap = {
      Jan: 1,
      Feb: 2,
      Mar: 3,
      Apr: 4,
      May: 5,
      Jun: 6,
      Jul: 7,
      Aug: 8,
      Sep: 9,
      Oct: 10,
      Nov: 11,
      Dec: 12,
    };
    return [...data].sort((a, b) => {
      const [monthA, yearA] = a.name.split(" ");
      const [monthB, yearB] = b.name.split(" ");
      if (parseInt(yearA) === parseInt(yearB)) {
        return monthMap[monthA] - monthMap[monthB];
      }
      return parseInt(yearA) - parseInt(yearB);
    });
  }, [data]);

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

      {sortedData.length === 0 ? (
        <div className="h-[350px] flex items-center justify-center text-gray-400 italic">
          No sales data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={sortedData}
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
