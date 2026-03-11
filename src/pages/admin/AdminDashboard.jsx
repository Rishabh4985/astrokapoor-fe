import React, { useContext } from "react";
import MonthlySalesChart from "../../components/charts/MonthlySalesChart.jsx";
import SalesVsRefundChart from "../../components/charts/SalesVsRefundChart.jsx";
import StatusChart from "../../components/charts/StatusChart.jsx";
import Filters from "../../components/shared/Filters.jsx";
import { AdminContext } from "../../context/AdminContext.jsx";
import { categoryOptionsConfig } from "../../utils/utils.js";

const AdminDashBoard = () => {
  const { loading, error, chartData } = useContext(AdminContext);

  const monthlySales = chartData["monthly-sales"]?.data || [];
  const salesVsRefund = chartData["sales-vs-refund"]?.data || [];
  const statusCount = chartData["status-count"]?.data || [];

  if (loading) return <div>Loading Dashboard...</div>;
  if (error) return <div>Error: {error}</div>;

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

      {/* Filters */}
      <Filters
        context={AdminContext}
        showSearch={true}
        showAdvancedToggle={true}
        categoryOptionsConfig={categoryOptionsConfig}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <MonthlySalesChart data={monthlySales} />
          <SalesVsRefundChart data={salesVsRefund} />
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-md xl:max-w-lg">
            <StatusChart data={statusCount} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashBoard;
