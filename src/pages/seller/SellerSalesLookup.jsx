import React, { useContext, useMemo, useCallback } from "react";
import { SellerContext } from "../../context/SellerContext";
import { Table2 } from "lucide-react";
import { toast } from "react-toastify";

import Excel from "../../components/shared/Excel";
import Filters from "../../components/shared/Filters.jsx";
import {
  expectedHeaders,
  headerLabels,
  categoryOptionsConfig,
} from "../../utils/utils.js";
import { formatValue } from "../../utils/formatter.js";

const SellerSalesLookup = () => {
  const { sellerRecords, totalPages, page, totalRecords, goToPage } =
    useContext(SellerContext);
  const itemsPerPage = 100;

  const visibleRecords = useMemo(() => {
    return Array.isArray(sellerRecords) ? sellerRecords : [];
  }, [sellerRecords]);

  // Dynamic table headers
  const dynamicHeaders = useMemo(() => {
    if (!visibleRecords.length) return new Set(Object.keys(expectedHeaders));

    return visibleRecords.reduce(
      (set, record) => {
        Object.keys(record).forEach((key) => set.add(key));
        return set;
      },
      new Set(Object.keys(expectedHeaders)),
    );
  }, [visibleRecords]);

  const headers = useMemo(() => {
    return Array.from(dynamicHeaders).filter(
      (key) => key.trim() !== "" && key !== "serialno" && key !== "_id",
    );
  }, [dynamicHeaders]);

  const startRecord = (page - 1) * itemsPerPage + 1;
  const endRecord = Math.min(page * itemsPerPage, totalRecords);

  // Excel Export (server-side filtered)
  const handleExport = useCallback(() => {
    toast.success(`Exporting ${totalRecords} filtered records`);
    return sellerRecords; // currently server-side filtered
  }, [sellerRecords, totalRecords]);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <div className="isolate overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-white via-orange-50/40 to-amber-50/40 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight text-orange-900">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-orange-200 bg-white text-orange-600 shadow-sm">
                  <Table2 className="h-5 w-5" />
                </span>
                My Sales Lookup
              </h2>
              <p className="inline-flex items-center rounded-full border border-orange-200 bg-white px-3 py-1 text-sm font-medium text-orange-700">
                Showing {startRecord} to {endRecord} of {totalRecords} records
              </p>
            </div>
            <div className="shrink-0">
              <Excel onExport={handleExport} />
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <Filters
            context={SellerContext}
            categoryOptionsConfig={categoryOptionsConfig}
            showSearch={false}
            showAdvancedToggle={true}
          />

          <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="sticky top-0 z-10 bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 text-orange-900">
                <tr>
                  {headers.map((key) => (
                    <th
                      key={key}
                      className="whitespace-nowrap border-r border-slate-200 px-4 py-3 text-center font-semibold"
                    >
                      {headerLabels[key] || key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleRecords.length > 0 ? (
                  visibleRecords.map((rec, i) => (
                    <tr
                      key={i}
                      className={`transition-colors ${
                        i % 2 === 0 ? "bg-white" : "bg-orange-50/40"
                      } hover:bg-orange-50`}
                    >
                      {headers.map((key) => (
                        <td
                          key={key}
                          className="whitespace-nowrap border-r border-slate-100 px-4 py-3 text-center text-sm"
                        >
                          {formatValue(key, rec[key])}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={headers.length}
                      className="py-10 text-center text-slate-500"
                    >
                      <div className="space-y-1">
                        <div className="text-base font-semibold text-slate-700">
                          No matching records found
                        </div>
                        <div className="text-sm">
                          Try adjusting filters to see more results.
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="sticky bottom-0 z-10 mt-3 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:flex-row">
              <div className="text-xs font-medium text-orange-700 sm:text-sm">
                Showing{" "}
                <span className="font-semibold text-orange-800">{startRecord}</span>{" "}
                to <span className="font-semibold text-orange-800">{endRecord}</span>{" "}
                of <span className="font-semibold text-orange-800">{totalRecords}</span>{" "}
                records
              </div>

              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Previous
              </button>

              <span className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages || totalPages === 0}
                className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerSalesLookup;
