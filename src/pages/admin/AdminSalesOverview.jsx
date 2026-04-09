import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  ListChecks,
  RefreshCcw,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import SellerTimeFilter from "../../components/shared/SellerTimeFilter";
import { handleBy } from "../../../../astrokapoor-be/controllers/frontUtilities.js";

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
  const [selectedYear] = useState(new Date().getFullYear());
  const [sellers, setSellers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState("");

  // Fetch sellers list on component mount
  useEffect(() => {
    const fetchSellers = async () => {
      if (!authToken) return;

      try {
        setSellerLoading(true);
        const res = await api.get("/admin/sellers", {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        console.log("SELLERS API:", res.data); // 👈 yahi line add karo
        setSellers(res.data || []);
      } catch (err) {
        console.error("Failed to fetch sellers:", err);
        setError("Failed to load sellers list");
      } finally {
        setSellerLoading(false);
      }
    };

    fetchSellers();
  }, [authToken]);

  // Fetch performance metrics based on selected seller and time filter
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
              year: selectedYear, // 👈 ADD THIS
          },
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const gedata = await res.data;
        console.log("response for dashboard", gedata);   //loggg
        /* console.log("Selected Year:", selectedYear);
console.log("---- Dashboard Summary ----");
console.log("Total Records:", res.data.totalRecordsHandled);
console.log("Converted Records:", res.data.totalConvertedRecords);
console.log("Refunded Records:", res.data.totalRefundedRecords);
console.log("This Month Sales:", formatCurrency(res.data.thisMonthSales));
console.log("This Month Refund:", formatCurrency(res.data.thisMonthRefund));
console.log("Achievement %:", res.data.achievementPct); */

console.log("---- Sellers Overview ----",handleBy);
           
        setMetrics(res.data || {});
      } catch (err) {
        console.error("Failed to fetch dashboard metrics:", err);
        setError("Failed to load dashboard data. Please try again.");
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [selectedSeller, timeFilter, authToken , selectedYear]); // 👈 ADD selectedYear TO DEPENDENCIES

  // Generate dashboard cards based on metrics
  const dashboardCards = useMemo(() => {
    if (!metrics) return [];

    const cardConfig = [
      {
        title: "Total Records Handled",
        value: new Intl.NumberFormat("en-IN").format(
          Number(metrics.totalRecordsHandled || 0)
        ),
        secondary: `↗ ${formatCurrency(metrics.thisMonthSales || 0)}`,
        icon: FileText,
        iconClass: "bg-emerald-100 text-emerald-700",
        dotClass: "bg-emerald-500",
      },
      {
        title: "Pending Followups",
        value: new Intl.NumberFormat("en-IN").format(
          Number(metrics.pendingFollowups || 0)
        ),
        secondary:
          metrics.pendingFollowupsAmount > 0
            ? `↗ ${formatCurrency(metrics.pendingFollowupsAmount)}`
            : undefined,
        icon: ListChecks,
        iconClass: "bg-amber-100 text-amber-700",
        dotClass: "bg-amber-500",
      },
      {
        title: "Total Converted Records",
        value: new Intl.NumberFormat("en-IN").format(
          Number(metrics.totalConvertedRecords || 0)
        ),
        secondary:
          metrics.totalConvertedAmount > 0
            ? `↗ ${formatCurrency(metrics.totalConvertedAmount)}`
            : undefined,
        icon: FileText,
        iconClass: "bg-violet-100 text-violet-700",
        dotClass: "bg-violet-500",
      },
      {
        title: "Total Refunded Records",
        value: new Intl.NumberFormat("en-IN").format(
          Number(metrics.totalRefundedRecords || 0)
        ),
        secondary: `↘ ${formatCurrency(metrics.thisMonthRefund || 0)}`,
        icon: RefreshCcw,
        iconClass: "bg-rose-100 text-rose-700",
        dotClass: "bg-rose-500",
      },
    ];

    return cardConfig;
  }, [metrics]);

//   const handledByList = [
//   ...new Set(sellers.map(s => s.firstName + " " + (s.lastName || "")))
// ];

  // Calculate target achievement progress
  const achievementPct = metrics?.achievementPct ? Number(metrics.achievementPct) : 0;
  const achievementWidth = Math.min(100, Math.max(0, achievementPct));

  return (
    <div className="mx-auto w-full max-w-6xl mt-10 space-y-6">
      {/* Sales Performance Overview Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-orange-100">
       {/* <div className="bg-gradient-to-r from-orange-500 to-yellow-700 p-7 rounded-xl flex items-center justify-between mb-4">
        */}
        <div className="overflow-hidden p-7 rounded-2xl border border-transparent bg-gradient-to-r from-[#b56324] via-[#d28235] to-[#f6b34a] shadow-[0_6px_16px_rgba(0,0,0,0.18)] rounded-xl flex items-center justify-between mb-4">

        
  <h2 className="text-white font-bold">
    Sales Performance Overview
  </h2>


  <select
    value={selectedSeller}
    onChange={(e) => setSelectedSeller(e.target.value)}
    disabled={sellerLoading}
    className="bg-white/90 backdrop-blur-sm text-gray-800 px-4 py-1.5 rounded-full text-sm shadow-sm border border-white/40 focus:outline-none"
  >
   <option value="all">All Handlers</option>

{/* {handledByList.map((name, i) => (
  <option key={i} value={name}>
    {name}
  </option>
))} */}
{handleBy.map((name, i) => (
  <option key={i} value={name}>
    {name}
  </option>
))}

{/* 
{sellers.map((seller) => (
  <option key={seller._id} value={seller._id}>
    {seller.firstName + " " + (seller.lastName || "")}
  </option>
))} */}

  </select>

</div>

        {/* <h2 className="text-xl font-bold text-gray-800 mb-4">
          Sales Performance Overview
        </h2> */}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Seller Selector Dropdown */}
        {/* <div className="mb-4">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Select Seller
          </label>
          <select
            value={selectedSeller}
            onChange={(e) => setSelectedSeller(e.target.value)}
            disabled={sellerLoading}
            className="w-full md:w-64 border border-slate-300 rounded-lg p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="all">All Sellers - Aggregated View</option>
            {sellers.map((seller) => (
              <option key={seller.id || seller._id} value={seller.id || seller._id}>
                {seller.firstName + " " + (seller.lastName || "")}



              </option>
            ))}
          </select>
        </div> */}

        {/* Time Filter */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <SellerTimeFilter value={timeFilter} onChange={setTimeFilter} />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">
            Loading metrics...
          </div>
        ) : !metrics ? (
          <div className="text-center py-10 text-gray-500">
            No data available. Please try again.
          </div>
        ) : (
          <div className="space-y-5">
            {/* Performance Snapshot Cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {dashboardCards.map(
                ({
                  title,
                  value,
                  secondary,
                  icon,
                  iconClass,
                }) => (
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
                )
              )}
            </section>

            {/* Target Achievement Progress Bar */}
            <section className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-amber-50 to-white p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-lg font-bold text-orange-900">
                  Target Achievement
                </h4>
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
                    {formatCurrency(metrics.finalTarget)}
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

            {/* Sellers Table - Only shown when "All Sellers" is selected */}
            {selectedSeller === "all" && sellers.length > 0 && (
             <section className="rounded-2xl border border-orange-200 bg-orange-50/30 shadow-sm overflow-hidden">
                <div className="border-b border-orange-400 px-5 py-4 bg-orange-50/80">
                  <h4 className="text-lg font-bold text-slate-900">
                    All Sellers Overview
                  </h4>
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
                    {/*   {sellers.map((seller, idx) => (
                        <tr
                          key={seller.id || seller._id}
                          className={`border-b border-slate-100 ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                          } hover:bg-orange-50/30 transition`}
                        >
                          <td className="px-5 py-3 font-medium text-slate-900">
                            {seller.firstName + " " + (seller.lastName || "")}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-700">
                            {seller.totalRecordsHandled || seller.records || 0}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-700">
                            {formatCurrency(seller.totalRevenue || seller.revenue || 0)}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-700">
                            {seller.totalConvertedRecords || seller.converted || 0}
                          </td>
                        </tr>
                      ))} */}
                        {/* {handleBy.map((seller, idx) => (
                        <tr
                          key={seller.id || seller._id}
                          className={`border-b border-slate-100 ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                          } hover:bg-orange-50/30 transition`}
                        >
                          <td className="px-5 py-3 font-medium text-slate-900">
                            {seller}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-700">
                            0
                          </td>
                          <td className="px-5 py-3 text-right text-slate-700">
                            0
                          </td>
                          <td className="px-5 py-3 text-right text-slate-700">
                            0
                          </td>
                        </tr>
                      ))} */}

                      {metrics?.sellerWiseData?.length > 0 ? (
  metrics.sellerWiseData.map((s, idx) => (
    <tr
      key={idx}
      className={`border-b border-slate-100 ${
        idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
      } hover:bg-orange-50/40 transition`}
    >
      <td className="px-5 py-4 font-medium text-slate-900">
        {s._id}
      </td>
      <td className="px-5 py-3 text-right font-medium text-slate-800">
        {s.records}
      </td>
      <td className="px-5 py-4 text-right font-medium text-slate-800">
          {s.converted}
      </td>
      <td className="px-5 py-3 text-right font-medium text-slate-800">
         {formatCurrency(s.revenue)}
      </td>
    </tr>
  ))
) : (
  <tr>
    <td colSpan="4" className="text-center py-4">
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
