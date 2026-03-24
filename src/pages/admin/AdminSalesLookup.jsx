import React, { useContext, useMemo } from "react";
import { AdminContext } from "../../context/AdminContext";
import OptionsContext from "../../context/OptionsContext";
import Excel from "../../components/shared/Excel";
import Filters from "../../components/shared/Filters";
import { toast } from "react-toastify";
import { Table2 } from "lucide-react";
import {
  expectedHeaders,
  headerLabels,
  categoryOptionsConfig,
} from "../../utils/utils.js";
import { formatValue } from "../../utils/formatter.js";

const AdminSalesLookup = () => {
  const { loading: optionsLoading } = useContext(OptionsContext);

  const {
    records = [],
    page,
    totalPages,
    totalRecords,
    itemsPerPage = 100,
    goToPage,
    importRecords,
    fetchAllRecordsForExport,
  } = useContext(AdminContext);

  // =============================
  // Flatten records (if nested)
  // =============================
  const flattenedRecords = useMemo(() => {
    if (!Array.isArray(records) || records.length === 0) return [];

    if (!records[0]?.records) return records;

    return records.flatMap((user) => {
      if (!user.records || !user.userData) return [];
      return user.records.map((record) => ({
        ...record,
        customerName: user.userData?.customerName || "",
        email1: user.userData?.email1 || "",
        email2: user.userData?.email2 || "",
        mobile1: user.userData?.mobile1 || "",
        mobile2: user.userData?.mobile2 || "",
      }));
    });
  }, [records]);

  // =============================
  // Headers
  // =============================
  const headers = useMemo(() => {
    const baseHeaders = new Set(Object.keys(expectedHeaders));

    flattenedRecords.forEach((record) => {
      Object.keys(record).forEach((key) => {
        if (key && key.trim() && key !== "_id" && key !== "serialno") {
          baseHeaders.add(key);
        }
      });
    });

    return Array.from(baseHeaders);
  }, [flattenedRecords]);

  // =============================
  // Pagination indexes
  // =============================
  const startIndex =
    flattenedRecords.length === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endIndex = Math.min(page * itemsPerPage, totalRecords);

  // =============================
  // Import / Export
  // =============================
  const handleImport = async (importedData) => {
    try {
      await importRecords(importedData);
      toast.success("Records imported and saved to database!");
    } catch (err) {
      toast.error("Import failed", err);
    }
  };

  const handleExport = async () => {
    const exportData = await fetchAllRecordsForExport();
    toast.success(`Exporting ${exportData.length} records`);
    return exportData;
  };

  if (optionsLoading) {
    return (
      <div className="p-6 text-center text-orange-700 font-semibold">
        Loading filter options...
      </div>
    );
  }

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
                Sales Lookup
              </h2>
              <p className="inline-flex items-center rounded-full border border-orange-200 bg-white px-3 py-1 text-sm font-medium text-orange-700">
                Showing {startIndex} to {endIndex} of {totalRecords} records
              </p>
            </div>

            <Excel onImport={handleImport} onExport={handleExport} />
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <Filters
            context={AdminContext}
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
              <tbody>
                {flattenedRecords.length > 0 ? (
                  flattenedRecords.map((rec, idx) => (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-orange-50/40"
                      } hover:bg-orange-50`}
                    >
                      {headers.map((key) => (
                        <td
                          key={key}
                          className="whitespace-nowrap border-r border-slate-100 px-4 py-3 text-center"
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
                      No matching records found.
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
                <span className="font-semibold text-orange-800">{startIndex}</span>{" "}
                to <span className="font-semibold text-orange-800">{endIndex}</span>{" "}
                of <span className="font-semibold text-orange-800">{totalRecords}</span>{" "}
                records
              </div>

              <button
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Previous
              </button>

              <span className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
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

export default AdminSalesLookup;
