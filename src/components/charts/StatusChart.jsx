import React, { useState, useEffect, useContext, useMemo } from "react";
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

import { filterRecords, countStatus } from "./utils"; // import your utils

const API_URL = import.meta.env.DEV
  ? "http://localhost:4000/api"
  : import.meta.env.VITE_API_URL;

const StatusChart = ({ filter = "all", category = "all" }) => {
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
    setError(null);
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

  const data = useMemo(() => {
    const filtered = filterRecords(records, filter, category);
    return countStatus(filtered);
  }, [records, filter, category]);

  if (loading) return <div>Loading Status Chart...</div>;
  if (error) return <div>Error: {error}</div>;

  if (!data.length) {
    return (
      <div className="h-[350px] flex items-center justify-center text-gray-400 italic">
        No status data available
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl shadow-md p-4 sm:p-6 mb-6 w-full overflow-visible">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-orange-700" />
        <h3 className="text-lg sm:text-xl font-semibold text-orange-800 italic">
          Status Summary
        </h3>
      </div>

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
    </div>
  );
};

export default StatusChart;
