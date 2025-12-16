import React, { useContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import { SellerContext } from "../../context/SellerContext";
import { useAuth } from "../../context/AuthContext";

import Excel from "../../components/shared/Excel";
import MonthlySalesChart from "../../components/charts/MonthlySalesChart.jsx";
import SalesVsRefundChart from "../../components/charts/SalesVsRefundChart.jsx";
import StatusChart from "../../components/charts/StatusChart.jsx";

import { PackageCheck, Filter } from "lucide-react";

const SellerDashboard = () => {
  const { importSellerRecords } = useContext(SellerContext);
  const { currentSeller } = useAuth();

  const [filter, setFilter] = useState(
    () => sessionStorage.getItem("sellerFilterType") || "all"
  );
  const [category, setCategory] = useState("all");

  useEffect(() => {
    sessionStorage.setItem("sellerFilterType", filter);
  }, [filter]);

  const handleImport = (importedRecords) => {
    const structured = importedRecords.map((rec) => ({
      ...rec,
      handlerId: currentSeller?.email || "",
      amount: Number(rec.amount) || 0,
      refund: Number(rec.refund) || 0,
      pendingAmount: Number(rec.pendingAmount) || 0,
    }));
    importSellerRecords(structured);
    toast.success("Import Successful");
  };

  const handleExport = () => {
    toast.warn("Export functionality requires backend integration.");
    return [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
        <header className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-800">
            AstroKapoor
          </h1>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-orange-600">
            Seller Dashboard
          </h2>
        </header>

        <div className="bg-white rounded-lg shadow-md border border-orange-200">
          <div className="p-4 border-b border-orange-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Excel onImport={handleImport} onExport={handleExport} />
              <div className="bg-orange-100 rounded-lg px-4 py-3 text-orange-900 font-semibold shadow-sm border border-orange-200 text-center sm:text-left">
                <div className="text-sm sm:text-base">
                  Category: <span className="font-bold">{category}</span>
                  <span className="mx-2">|</span>
                  Filter: <span className="font-bold">{filter}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-6 lg:items-center lg:justify-center">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                <label className="flex items-center gap-2 text-orange-700 font-medium whitespace-nowrap">
                  <PackageCheck className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Category:</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full sm:w-auto min-w-[140px] border border-orange-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm bg-white shadow-sm"
                >
                  <option value="all">All</option>
                  <option value="gemstones">Gemstones</option>
                  <option value="products">Products</option>
                  <option value="consultation">Consultation</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                <label className="flex items-center gap-2 text-orange-700 font-medium whitespace-nowrap">
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Filter By:</span>
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full sm:w-auto min-w-[140px] border border-orange-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm bg-white shadow-sm"
                >
                  <option value="day">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>
          </div>
        </div>

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
    </div>
  );
};

export default SellerDashboard;
