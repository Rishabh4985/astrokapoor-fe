import React, { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { AdminContext } from "../../context/AdminContext";

import Excel from "../../components/shared/Excel";
import MonthlySalesChart from "../../components/charts/MonthlySalesChart.jsx";
import SalesVsRefundChart from "../../components/charts/SalesVsRefundChart.jsx";
import StatusChart from "../../components/charts/StatusChart.jsx";

import { BarChart3, Filter, Tags } from "lucide-react";

const AdminDashBoard = () => {
  const { importRecords } = useContext(AdminContext);
  const [filter, setFilter] = useState(
    () => sessionStorage.getItem("filterType") || "all"
  );
  const [category, setCategory] = useState(
    () => sessionStorage.getItem("categoryType") || "all"
  );

  useEffect(() => {
    sessionStorage.setItem("filterType", filter);
  }, [filter]);

  useEffect(() => {
    sessionStorage.setItem("categoryType", category);
  }, [category]);

  const handleImport = (importedRecords) => {
    const cleaned = importedRecords.map((rec) => ({
      ...rec,
      amount: Number(rec.amount) || 0,
      refund: Number(rec.refund) || 0,
      pendingAmount: Number(rec.pendingAmount) || 0,
    }));
    importRecords(cleaned);
    toast.success("Import Successful");
  };

  const handleExport = () => {
    toast.warn("Export functionality requires backend integration.");
    return [];
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 min-h-screen bg-gray-50 space-y-8">
      <header className="text-center space-y-1">
        <h1 className="text-4xl font-bold text-orange-900 tracking-wide">
          AstroKapoor
        </h1>
        <h2 className="text-2xl font-semibold text-orange-700">
          Admin Dashboard
        </h2>
      </header>

      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
          <Excel onImport={handleImport} onExport={handleExport} />
        </div>

        <div className="bg-orange-100 rounded-md px-4 py-1 text-orange-900 font-semibold shadow text-center md:text-left">
          Filter: {filter}, Category: {category}
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-center md:justify-end">
          <label className="flex items-center gap-2 text-orange-800">
            <Tags className="w-4 h-4" />
            <span className="font-semibold">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border rounded px-3 py-1 bg-white text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All</option>
              <option value="gemstones">Gemstones</option>
              <option value="products">Products</option>
              <option value="consultation">Consultation</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-orange-800">
            <Filter className="w-4 h-4" />
            <span className="font-semibold">Filter By:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded px-3 py-1 bg-white text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </label>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <div className="xl:col-span-1">
              <MonthlySalesChart filter={filter} category={category} />
            </div>
            <div className="xl:col-span-1">
              <SalesVsRefundChart filter={filter} category={category} />
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-md xl:max-w-lg">
              <StatusChart filter={filter} category={category} />
            </div>
          </div>
        </div>
    </div>
  );
};

export default AdminDashBoard;
