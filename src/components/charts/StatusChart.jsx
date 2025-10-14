import React, { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../../context/AuthContext";
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

const API_URL = import.meta.env.DEV
  ? "http://localhost:4000/api"
  : import.meta.env.VITE_API_URL;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

const StatusChart = () => {
  const { authToken, userRole } = useContext(AuthContext);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchedRef = useRef(null);

  useEffect(() => {
    if (!authToken || !userRole) {
      setLoading(false);
      setError("Not authenticated");
      setData([]);
      return;
    }

    const now = Date.now();
    if (lastFetchedRef.current && now - lastFetchedRef.current < CACHE_DURATION) {
      // Use cached data
      return;
    }

    setLoading(true);
    setError(null);
    const basePath = `${API_URL}/${userRole}/charts`;

    fetch(`${basePath}/status-count`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((result) => {
        setData(result);
        lastFetchedRef.current = Date.now();
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [authToken, userRole]);

  const isEmpty = !data || data.length === 0;

  if (loading) return <div>Loading Status Chart...</div>;
  if (error) return <div>Error: {error}</div>;

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
          <BarChart data={data} margin={{ top: 10, right: 0, bottom: 10, left: -17 }}>
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
