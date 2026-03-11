import React, { useContext } from "react";
import MonthlySalesChart from "../../components/charts/MonthlySalesChart.jsx";
import SalesVsRefundChart from "../../components/charts/SalesVsRefundChart.jsx";
import StatusChart from "../../components/charts/StatusChart.jsx";
import Filters from "../../components/shared/Filters.jsx";
import { SellerContext } from "../../context/SellerContext.jsx";
import { categoryOptionsConfig } from "../../utils/utils.js";

const SellerDashboard = () => {
  const { loading, chartData } = useContext(SellerContext);

  const monthlySales = chartData["monthly-sales"]?.data || [];
  const salesVsRefund = chartData["sales-vs-refund"]?.data || [];
  const statusCount = chartData["status-count"]?.data || [];

  if (loading)
    return <div className="p-6 text-center">Loading Seller Dashboard...</div>;

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

        <Filters
          context={SellerContext}
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
    </div>
  );
};

export default SellerDashboard;
