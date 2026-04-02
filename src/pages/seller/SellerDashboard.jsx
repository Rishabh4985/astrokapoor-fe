import React, { useContext, useMemo } from "react";
import MonthlySalesChart from "../../components/charts/MonthlySalesChart.jsx";
import SalesVsRefundChart from "../../components/charts/SalesVsRefundChart.jsx";
import StatusChart from "../../components/charts/StatusChart.jsx";
import Filters from "../../components/shared/Filters.jsx";
import { SellerContext } from "../../context/SellerContext.jsx";
import { categoryOptionsConfig } from "../../utils/utils.js";
import {
  WalletCards,
  RotateCcw,
  ListChecks,
  BarChart3,
  CirclePlus,
} from "lucide-react";

const SellerDashboard = () => {
  const { chartData } = useContext(SellerContext);

  const monthlySalesState = chartData["monthly-sales"] || {};
  const salesVsRefundState = chartData["sales-vs-refund"] || {};
  const statusCountState = chartData["status-count"] || {};

  const monthlySales = monthlySalesState.data || [];
  const salesVsRefund = salesVsRefundState.data || [];
  const statusCount = statusCountState.data || [];
  const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const monthlySalesTotal = useMemo(
    () =>
      monthlySales.reduce((sum, row) => sum + toNumber(row?.total || row?.value), 0),
    [monthlySales],
  );

  const totalStatusCount = useMemo(
    () => statusCount.reduce((sum, row) => sum + toNumber(row?.value), 0),
    [statusCount],
  );

  const refundTotal = useMemo(
    () =>
      salesVsRefund.reduce((sum, row) => {
        const name = (row?.name || "").toString().toLowerCase();
        return name.includes("refund") ? sum + toNumber(row?.value) : sum;
      }, 0),
    [salesVsRefund],
  );

  const salesTotal = useMemo(
    () =>
      salesVsRefund.reduce((sum, row) => {
        const name = (row?.name || "").toString().toLowerCase();
        return name.includes("sale") ? sum + toNumber(row?.value) : sum;
      }, 0),
    [salesVsRefund],
  );

  const kpiCards = [
    {
      title: "Total Sales",
      value: salesTotal || monthlySalesTotal,
      icon: WalletCards,
      accent: "from-orange-500 to-amber-400",
      note: "Current filtered view",
    },
    {
      title: "Total Refund",
      value: refundTotal,
      icon: RotateCcw,
      accent: "from-orange-400 to-orange-600",
      note: "Current filtered view",
    },
    {
      title: "Status Types",
      value: statusCount.length,
      icon: ListChecks,
      accent: "from-amber-500 to-orange-500",
      note: "Distinct statuses",
    },
    {
      title: "Status Volume",
      value: totalStatusCount,
      icon: BarChart3,
      accent: "from-orange-600 to-amber-500",
      note: "Total records in statuses",
    },
  ];

  const formatMetric = (value) => new Intl.NumberFormat("en-IN").format(value);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Seller Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Insight board for sales and performance
          </p>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <Filters
            context={SellerContext}
            showSearch={false}
            showAdvancedToggle={true}
            categoryOptionsConfig={categoryOptionsConfig}
          />

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map(({ title, value, icon: Icon, accent, note }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div
                  className={`mb-4 h-1.5 w-full rounded-full bg-gradient-to-r ${accent} opacity-90`}
                />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {title}
                    </p>
                    <p className="mt-1 text-3xl font-black text-slate-900">
                      {formatMetric(value)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{note}</p>
                  </div>
                  <span className="rounded-xl bg-slate-100 p-2 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
              </article>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <MonthlySalesChart
                data={monthlySales}
                loading={Boolean(monthlySalesState.loading)}
              />
            </div>
            <div className="xl:col-span-1">
              <SalesVsRefundChart
                data={salesVsRefund}
                loading={Boolean(salesVsRefundState.loading)}
              />
            </div>
            <div className="xl:col-span-2">
              <StatusChart
                data={statusCount}
                loading={Boolean(statusCountState.loading)}
              />
            </div>
            <aside className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-600 via-amber-500 to-orange-400 p-5 text-white shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold">Quick Tasks</h3>
                  <p className="text-sm text-orange-100">
                    Keep daily sales actions in check
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg bg-white/20 p-1.5 backdrop-blur-sm"
                >
                  <CirclePlus className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {[
                  "Follow up pending refunds",
                  "Review high value leads",
                  "Update today follow-up remarks",
                ].map((task) => (
                  <div
                    key={task}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm"
                  >
                    {task}
                  </div>
                ))}
              </div>
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
