import React, { useContext } from "react";
import MonthlySalesChart from "../../components/charts/MonthlySalesChart.jsx";
import SalesVsRefundChart from "../../components/charts/SalesVsRefundChart.jsx";
import StatusChart from "../../components/charts/StatusChart.jsx";
import Filters from "../../components/shared/Filters.jsx";
import { AdminContext } from "../../context/AdminContext.jsx";
import { categoryOptionsConfig } from "../../utils/utils.js";

const AdminDashBoard = () => {
  const { error, chartData } = useContext(AdminContext);

  const monthlySalesState = chartData["monthly-sales"] || {};
  const salesVsRefundState = chartData["sales-vs-refund"] || {};
  const statusCountState = chartData["status-count"] || {};

  const monthlySales = monthlySalesState.data || [];
  const salesVsRefund = salesVsRefundState.data || [];
  const statusCount = statusCountState.data || [];

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Control metrics, team performance and status mix
          </p>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Filters
            context={AdminContext}
            showSearch={false}
            showAdvancedToggle={true}
            categoryOptionsConfig={categoryOptionsConfig}
          />

          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <MonthlySalesChart
                data={monthlySales}
                loading={Boolean(monthlySalesState.loading)}
              />
              <SalesVsRefundChart
                data={salesVsRefund}
                loading={Boolean(salesVsRefundState.loading)}
              />
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-4xl">
                <StatusChart
                  data={statusCount}
                  loading={Boolean(statusCountState.loading)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashBoard;
