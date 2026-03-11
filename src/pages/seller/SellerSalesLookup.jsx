import React, { useContext, useMemo, useCallback } from "react";
import { SellerContext } from "../../context/SellerContext";
import { Table2 } from "lucide-react";
import { toast } from "react-toastify";

import Excel from "../../components/shared/Excel";
import Filters from "../../components/shared/Filters.jsx";
import { expectedHeaders, headerLabels,categoryOptionsConfig } from "../../utils/utils.js";
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
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-lg border border-orange-100">
        {/* Header Section */}
        <div className="p-4 sm:p-6 border-b border-orange-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-orange-800 flex items-center gap-2">
                <Table2 className="w-6 h-6" />
                My Sales LookUp
                <p className="text-sm text-orange-600">
                  (showing {startRecord}–{endRecord} of {totalRecords} records)
                </p>
              </h2>
            </div>
            <div className="shrink-0">
              <Excel onExport={handleExport} />
            </div>
          </div>
          <Filters
            context={SellerContext} // backend fetch context
            categoryOptionsConfig={categoryOptionsConfig}
            showSearch={true}
            showAdvancedToggle={true}
          />
        </div>

        {/* Table Section */}
        <div className="relative p-4 sm:p-6">
          <div className="overflow-auto max-h-[60vh] min-h-[300px] rounded-lg border border-orange-200">
            <table className="min-w-full divide-y divide-orange-200 text-sm">
              <thead className="bg-orange-100 text-orange-800 sticky top-0 z-10">
                <tr>
                  {headers.map((key) => (
                    <th
                      key={key}
                      className="px-3 py-3 sm:px-4 sm:py-4 font-medium whitespace-nowrap text-center border-r border-orange-200 last:border-r-0"
                    >
                      {headerLabels[key] || key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {visibleRecords.length > 0 ? (
                  visibleRecords.map((rec, i) => (
                    <tr
                      key={i}
                      className={`hover:bg-orange-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-orange-25"}`}
                    >
                      {headers.map((key) => (
                        <td
                          key={key}
                          className="px-3 py-3 sm:px-4 sm:py-4 border-r border-orange-100 last:border-r-0 whitespace-nowrap text-center text-xs sm:text-sm"
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
                      className="text-center py-8 text-gray-500"
                    >
                      <div className="space-y-2">
                        <div className="text-lg font-medium">
                          No matching records found
                        </div>
                        <div className="text-sm">
                          Try adjusting your search criteria or clear filters
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="sticky bottom-0 bg-white flex flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-lg border-t border-orange-300 z-10">
              <div className="text-sm text-orange-700 text-center sm:text-left">
                <span className="text-xs text-orange-700">
                  (showing {startRecord}–{endRecord} of {totalRecords} records)
                </span>
                <span className="hidden sm:inline">
                  {" "}
                  (Page {page} of {totalPages})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-2 bg-orange-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors text-sm"
                >
                  Previous
                </button>

                <div className="px-3 py-2 bg-white border border-orange-300 rounded-lg text-sm min-w-[80px] text-center">
                  {page} / {totalPages}
                </div>

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages || totalPages === 0}
                  className="px-3 py-2 bg-orange-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerSalesLookup;
