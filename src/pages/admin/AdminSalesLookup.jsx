import React, { useContext, useMemo } from "react";
import { AdminContext } from "../../context/AdminContext";
import OptionsContext from "../../context/OptionsContext";
import Excel from "../../components/shared/Excel";
import Filters from "../../components/shared/Filters";
import { toast } from "react-toastify";
import { Sparkles } from "lucide-react";
import { expectedHeaders, headerLabels,categoryOptionsConfig } from "../../utils/utils.js";
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

  const handleExport = () => {
    toast.success(`Exporting ${flattenedRecords.length} records`);
    return flattenedRecords;
  };

  if (optionsLoading) {
    return (
      <div className="p-6 text-center text-orange-700 font-semibold">
        Loading filter options...
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-orange-50 via-white to-orange-100 rounded-2xl shadow-xl mb-8 border border-orange-200 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 relative z-10">
        <h2 className="text-2xl font-extrabold text-orange-800 flex items-center gap-2 drop-shadow-sm">
          <Sparkles className="w-6 h-6 text-yellow-500 animate-ping" />
          Admin Sales Lookup
          <span className="text-sm font-normal text-orange-600">
            (showing {startIndex} to {endIndex} of {totalRecords})
          </span>
        </h2>

        <Excel onImport={handleImport} onExport={handleExport} />
      </div>

      {/* Filters */}
      <div className="bg-white/70 border border-orange-200 backdrop-blur-sm rounded-xl p-3 mb-6 shadow-md relative z-10">
        <Filters
          context={AdminContext}
          categoryOptionsConfig={categoryOptionsConfig}
          showSearch={true}
          showAdvancedToggle={true}
        />
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[500px] min-h-[300px] rounded-xl border border-orange-200 shadow-inner relative z-10">
        <table className="min-w-full divide-y divide-orange-200 text-sm">
          <thead className="bg-gradient-to-r from-orange-200 to-orange-100 text-orange-900 sticky top-0 z-10 shadow-sm">
            <tr>
              {headers.map((key) => (
                <th
                  key={key}
                  className="px-4 py-2 font-semibold whitespace-nowrap text-center border-r border-orange-200"
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
                  className={`transition-colors duration-200 ${
                    idx % 2 === 0
                      ? "bg-white hover:bg-orange-50"
                      : "bg-orange-50 hover:bg-orange-100"
                  }`}
                >
                  {headers.map((key) => (
                    <td
                      key={key}
                      className="px-4 py-2 border-r border-orange-100 whitespace-nowrap text-center"
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
                  className="text-center py-6 text-gray-500"
                >
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="sticky bottom-0 bg-white flex justify-center items-center gap-4 py-2 border-t border-orange-300 z-10">
        <button
          onClick={() => goToPage(page - 1)}
          disabled={page <= 1}
          className="px-4 py-2 rounded-lg bg-orange-300 hover:bg-orange-400 transition text-white font-semibold disabled:opacity-50 shadow-md"
        >
          Previous
        </button>

        <span className="flex items-center px-2 font-semibold text-orange-700">
          Page {page} of {totalPages}
          <span className="text-sm ml-2 text-orange-600">
            (showing {startIndex} to {endIndex} of {totalRecords})
          </span>
        </span>

        <button
          onClick={() => goToPage(page + 1)}
          disabled={page >= totalPages}
          className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 transition text-white font-semibold disabled:opacity-50 shadow-md"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminSalesLookup;
