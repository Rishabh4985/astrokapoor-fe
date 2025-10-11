import React, { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { AdminContext } from "../../context/AdminContext";
import Excel from "../../components/shared/Excel";
import {
  getMonthlySalesData,
  getSalesVsRefundData,
  getStatusCountData,
} from "../../components/charts/utils.jsx";

import MonthlySalesChart from "../../components/charts/MonthlySalesChart.jsx";
import SalesVsRefundChart from "../../components/charts/SalesVsRefundChart.jsx";
import StatusChart from "../../components/charts/StatusChart.jsx";

import { BarChart3, Filter, Tags } from "lucide-react";

const flattenRecords = (structuredRecords) => {
  return structuredRecords.flatMap((user) => {
    if (!user.records || !Array.isArray(user.records)) return [];
    return user.records.map((rec) => ({
      ...rec,
      customerName: user.userData?.customerName || "",
    }));
  });
};

const parseDate = (value) => {
  if (typeof value === "string" && value.includes("/")) {
    const [day, month, year] = value.split("/");
    return new Date(`${year}-${month}-${day}`);
  }
  return new Date(value);
};

const filterByDateRange = (records, range) => {
  const now = new Date();

  return records.filter((record) => {
    const date = parseDate(record.dateOfPayment);
    if (isNaN(date)) return false;

    switch (range) {
      case "day":
        return date.toDateString() === now.toDateString();
      case "week": {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        return date >= startOfWeek && date <= now;
      }
      case "month":
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      case "year":
        return date.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });
};

const AdminDashBoard = () => {
  const { records, allRecords, importRecords } = useContext(AdminContext);
  const [filter, setFilter] = useState(
    () => sessionStorage.getItem("filterType") || "all"
  );

  useEffect(() => {
    sessionStorage.setItem("filterType", filter);
  }, [filter]);

  const [category, setCategory] = useState("all");

  const flatAllRecords = Array.isArray(allRecords[0]?.records)
    ? flattenRecords(allRecords)
    : allRecords;

  const dateFilteredRecords =
    filter === "all"
      ? flatAllRecords
      : filterByDateRange(flatAllRecords, filter);

  const filteredByCategory = dateFilteredRecords.filter((r) => {
    if (category === "all") return true;
    return r.category === category;
  });

  const totalSales = filteredByCategory.length;

  const monthlySalesData = getMonthlySalesData(filteredByCategory);
  const salesVsRefundData = getSalesVsRefundData(filteredByCategory);
  const statusData = getStatusCountData(filteredByCategory);

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
    if (!records.length) {
      toast.warn("No records to export.");
      return [];
    }
    return records;
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
          Sales this {filter}: {totalSales}
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-center md:justify-end">
          <label className="flex items-center gap-2 text-orange-800">
            <Tags className="w-4 h-4" />
            <span className="font-semibold">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border rounded px-3 py-1 bg-white text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="Select category"
            >
              <option value="all">All</option>
              <option value="Gemstones">Gemstones</option>
              <option value="Products">Products</option>
              <option value="Consultation">Consultation</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-orange-800">
            <Filter className="w-4 h-4" />
            <span className="font-semibold">Filter By:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded px-3 py-1 bg-white text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="Select time filter"
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

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MonthlySalesChart data={monthlySalesData} />
        <SalesVsRefundChart data={salesVsRefundData} />
        <StatusChart data={statusData} />
      </main>
    </div>
  );
};

export default AdminDashBoard;
