import React, { useEffect, useMemo, useState } from "react";
import { FileText, ListChecks, RefreshCcw } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import SellerTimeFilter from "../../components/shared/SellerTimeFilter";

const API_BASE = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE,
});

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const AdminSalesOverview = () => {
  const { authToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sellerLoading, setSellerLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState("all");
  const [timeFilter, setTimeFilter] = useState("monthly");
  const [sellers, setSellers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSellers = async () => {
      if (!authToken) return;

      try {
        setSellerLoading(true);
        const res = await api.get("/admin/sellers", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setSellers(Array.isArray(res.data) ? res.data : []);
      } catch {
        setError("Failed to load sellers list");
      } finally {
        setSellerLoading(false);
      }
    };

    fetchSellers();
  }, [authToken]);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!authToken) return;

      setLoading(true);
      setError("");
      try {
        const res = await api.get("/admin/dashboard", {
          params: {
            seller: selectedSeller,
            filter: timeFilter,
          },
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setMetrics(res.data || {});
      } catch {
        setError("Failed to load dashboard data. Please try again.");
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [selectedSeller, timeFilter, authToken]);

  const sellerOptions = useMemo(
    () =>
      sellers.map((seller) => {
        const id = seller._id || seller.id || "";
        const fullName =
          `${seller.firstName || ""} ${seller.lastName || ""}`.trim() ||
          seller.fullName ||
          seller.email ||
          "Unknown Seller";
        const value = id || fullName;

        return { value, label: fullName };
      }),
    [sellers],
  );

  const dashboardCards = useMemo(() => {
    if (!metrics) return [];

    return [
      {
        title: "Total Records Handled",
        value: new Intl.NumberFormat("en-IN").format(
          Number(metrics.totalRecordsHandled || 0),
        ),
        secondary: `Sales: ${formatCurrency(metrics.thisMonthSales || 0)}`,
        icon: FileText,
        iconClass: "bg-emerald-100 text-emerald-700",
      },
      {
        title: "Pending Followups",
        value: new Intl.NumberFormat("en-IN").format(
          Number(metrics.pendingFollowups || 0),
        ),
        secondary:
          Number(metrics.pendingFollowupsAmount || 0) > 0
            ? `Amount: ${formatCurrency(metrics.pendingFollowupsAmount)}`
            : undefined,
        icon: ListChecks,
        iconClass: "bg-amber-100 text-amber-700",
      },
      {
        title: "Total Converted Records",
        value: new Intl.NumberFormat("en-IN").format(
          Number(metrics.totalConvertedRecords || 0),
        ),
        secondary:
          Number(metrics.totalConvertedAmount || 0) > 0
            ? `Amount: ${formatCurrency(metrics.totalConvertedAmount)}`
            : undefined,
        icon: FileText,
        iconClass: "bg-violet-100 text-violet-700",
      },
      {
        title: "Total Refunded Records",
        value: new Intl.NumberFormat("en-IN").format(
          Number(metrics.totalRefundedRecords || 0),
        ),
        secondary: `Refund: ${formatCurrency(metrics.thisMonthRefund || 0)}`,
        icon: RefreshCcw,
        iconClass: "bg-rose-100 text-rose-700",
      },
    ];
  }, [metrics]);

  const achievementPct = Number(metrics?.achievementPct || 0);
  const achievementWidth = Math.min(100, Math.max(0, achievementPct));
  const targetAmount =
    Number(metrics?.finalTarget || 0) || Number(metrics?.monthlyTarget || 0);

  return (
    <div className="mx-auto mt-10 w-full max-w-6xl space-y-6">
      <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center justify-between overflow-hidden rounded-2xl border border-transparent bg-gradient-to-r from-[#b56324] via-[#d28235] to-[#f6b34a] p-7 shadow-[0_6px_16px_rgba(0,0,0,0.18)]">
          <h2 className="font-bold text-white">Sales Performance Overview</h2>

          <select
            value={selectedSeller}
            onChange={(event) => setSelectedSeller(event.target.value)}
            disabled={sellerLoading}
            className="rounded-full border border-white/40 bg-white/90 px-4 py-1.5 text-sm text-gray-800 shadow-sm backdrop-blur-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
          >
            <option value="all">All Handlers</option>
            {sellerOptions.map((seller) => (
              <option key={seller.value} value={seller.value}>
                {seller.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SellerTimeFilter value={timeFilter} onChange={setTimeFilter} />
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading metrics...</div>
        ) : !metrics ? (
          <div className="py-10 text-center text-gray-500">
            No data available. Please try again.
          </div>
        ) : (
          <div className="space-y-5">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {dashboardCards.map(({ title, value, secondary, icon, iconClass }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-start">
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${iconClass}`}
                    >
                      {React.createElement(icon, { className: "h-4 w-4" })}
                    </span>
                  </div>

                  <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    {title}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                    {value}
                  </p>

                  {secondary && (
                    <p className="mt-2 flex items-center text-sm font-medium text-slate-600">
                      <span className="mr-2">{secondary}</span>
                    </p>
                  )}
                </article>
              ))}
            </section>

            <section className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-amber-50 to-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-lg font-bold text-orange-900">Target Achievement</h4>
                <span className="text-sm font-semibold text-orange-700">
                  {achievementPct.toFixed(2)}%
                </span>
              </div>

              <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-orange-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                  style={{ width: `${achievementWidth}%` }}
                />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <p>
                  Achieved:{" "}
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(metrics.thisMonthSales)}
                  </span>
                </p>
                <p>
                  Target:{" "}
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(targetAmount)}
                  </span>
                </p>
                <p>
                  Remaining:{" "}
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(metrics.remainingTarget)}
                  </span>
                </p>
              </div>
            </section>

            {selectedSeller === "all" && sellers.length > 0 && (
              <section className="overflow-hidden rounded-2xl border border-orange-200 bg-orange-50/30 shadow-sm">
                <div className="border-b border-orange-400 bg-orange-50/80 px-5 py-4">
                  <h4 className="text-lg font-bold text-slate-900">All Sellers Overview</h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-orange-100 bg-orange-50/40">
                        <th className="px-5 py-3 text-left font-semibold text-slate-700">
                          Seller Name
                        </th>
                        <th className="px-5 py-3 text-right font-semibold text-slate-700">
                          Records
                        </th>
                        <th className="px-5 py-3 text-right font-semibold text-slate-700">
                          Converted
                        </th>
                        <th className="px-5 py-3 text-right font-semibold text-slate-700">
                          Revenue
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics?.sellerWiseData?.length > 0 ? (
                        metrics.sellerWiseData.map((sellerData, index) => (
                          <tr
                            key={`${sellerData._id}-${index}`}
                            className={`border-b border-slate-100 ${
                              index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                            } transition hover:bg-orange-50/40`}
                          >
                            <td className="px-5 py-4 font-medium text-slate-900">
                              {sellerData._id || "Unknown"}
                            </td>
                            <td className="px-5 py-3 text-right font-medium text-slate-800">
                              {Number(sellerData.records || 0)}
                            </td>
                            <td className="px-5 py-4 text-right font-medium text-slate-800">
                              {Number(sellerData.converted || 0)}
                            </td>
                            <td className="px-5 py-3 text-right font-medium text-slate-800">
                              {formatCurrency(sellerData.revenue)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-4 text-center">
                            No data found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSalesOverview;
