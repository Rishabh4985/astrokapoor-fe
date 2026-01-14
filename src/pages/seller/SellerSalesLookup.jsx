import React, { useState, useContext, useMemo, useCallback } from "react";
import { SellerContext } from "../../context/SellerContext";
import Excel from "../../components/shared/Excel";
import { toast } from "react-toastify";
import { Table2 } from "lucide-react";
import {
  expectedHeaders,
  headerLabels,
} from "../../components/shared/Dropdown.js";
import Filters from "../../components/shared/Filters.jsx";

const SellerSalesLookup = () => {
  const { sellerRecords, importSellerRecords } = useContext(SellerContext);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  const nonCapitalizedFields = ["email1", "email2", "handlerId"];

  const capitalizeValue = (value) => {
    if (!value || typeof value !== "string") return value;
    return value
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const flattenedRecords = useMemo(() => {
    if (!sellerRecords || !Array.isArray(sellerRecords)) return [];

    return sellerRecords;
  }, [sellerRecords]);

  const dynamicHeaders = useMemo(() => {
    return flattenedRecords.reduce((set, record) => {
      Object.keys(record).forEach((key) => set.add(key));
      return set;
    }, new Set(Object.keys(expectedHeaders)));
  }, [flattenedRecords]);

  const headers = useMemo(() => {
    return Array.from(dynamicHeaders).filter(
      (key) => key.trim() !== "" && key !== "serialno" && key !== "_id"
    );
  }, [dynamicHeaders]);

  const formatValue = (key, value) => {
    if (value === null || value === undefined || value === "") return "-";

    if (key === "category" && typeof value === "string") {
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }

    if (key === "country" && typeof value === "string") {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }

    if (key === "state" && typeof value === "string") {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }

    if (typeof value === "object") {
      if (value?.seconds) {
        const date = new Date(value.seconds * 1000);
        return date.toLocaleDateString("en-GB");
      }
      if (value instanceof Date) {
        return value.toLocaleDateString("en-GB");
      }
      if (value.label) return value.label;
      return JSON.stringify(value);
    }

    if (
      key.toLowerCase().includes("date") &&
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      const [year, month, day] = value.split("-");
      return `${day}/${month}/${year}`;
    }

    if (
      typeof value === "string" &&
      value.length < 100 &&
      !nonCapitalizedFields.includes(key)
    ) {
      return capitalizeValue(value);
    }

    if (
      key.toLowerCase().includes("amount") ||
      key.toLowerCase().includes("refund") ||
      key.toLowerCase().includes("pending")
    ) {
      return `₹${Number(value).toFixed(2)}`;
    }

    if (
      typeof value === "string" &&
      value.length < 100 &&
      !nonCapitalizedFields.includes(key)
    ) {
      return capitalizeValue(value);
    }

    return value;
  };

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const startRecord = (currentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(
    currentPage * itemsPerPage,
    filteredRecords.length
  );

  const handleImport = useCallback(
    (importedData) => {
      importSellerRecords(importedData);
      toast.success("Records imported successfully!");
    },
    [importSellerRecords]
  );

  const handleExport = useCallback(() => {
    toast.success(`Exporting ${filteredRecords.length} filtered records`);
    return filteredRecords;
  }, [filteredRecords]);

  const handleFilter = useCallback((records) => {
    setFilteredRecords(records);
    setCurrentPage(1);
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-lg border border-orange-100">
        {/* Header Section */}
        <div className="p-4 sm:p-6 border-b border-orange-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-orange-800 flex items-center gap-2">
                <Table2 className="w-5 h-5 sm:w-6 sm:h-6" />
                Seller Sales Lookup
              </h2>
              <p className="text-sm text-orange-600">
                {filteredRecords.length} of {flattenedRecords.length} records
              </p>
            </div>
            <div className="shrink-0">
              <Excel onImport={handleImport} onExport={handleExport} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <Filters
          records={flattenedRecords}
          dateField="dateOfPayment"
          onFilter={handleFilter}
          categoryOptionsConfig={[
            { key: "status", label: "Status" },
            { key: "service", label: "Service" },
            { key: "handleBy", label: "Handled By" },
            { key: "mode", label: "Mode" },
            { key: "expert", label: "Expert" },
          ]}
        />

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
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((rec, i) => (
                    <tr
                      key={i}
                      className={`hover:bg-orange-50 transition-colors ${
                        i % 2 === 0 ? "bg-white" : "bg-orange-25"
                      }`}
                    >
                      {headers.map((key) => (
                        <td
                          className="px-3 py-3 sm:px-4 sm:py-4 border-r border-orange-100 last:border-r-0 whitespace-nowrap text-center text-xs sm:text-sm"
                          key={key}
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
                  (showing {startRecord}–{endRecord} of {filteredRecords.length}{" "}
                  filtered records)
                </span>
                <span className="hidden sm:inline">
                  {" "}
                  (Page {currentPage} of {totalPages})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-orange-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors text-sm"
                >
                  Previous
                </button>

                <div className="px-3 py-2 bg-white border border-orange-300 rounded-lg text-sm min-w-[80px] text-center">
                  {currentPage} / {totalPages}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages || totalPages === 0}
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
