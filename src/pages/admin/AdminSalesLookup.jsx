import React, { useState, useEffect, useContext, useMemo } from "react";
import { AdminContext } from "../../context/AdminContext";
import Excel from "../../components/shared/Excel";
import { toast } from "react-toastify";
import { Search, Calendar, Filter, Table2, Sparkles, Tags } from "lucide-react";
import {
  expectedHeaders,
  headerLabels,
  dropdownOptions,
} from "../../components/shared/Dropdown";
import Filters from "../../components/shared/Filters";

const AdminSalesLookup = ({ onFilter }) => {
  const {
    allRecords,
    setRecords,
    page,
    setPage,
    itemsPerPage = 100,
  } = useContext(AdminContext);

  const [filteredRecords, setFilteredRecords] = useState([]);

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
    if (!allRecords) return [];

    if (allRecords.length > 0 && !allRecords[0]?.records) {
      return allRecords;
    }

    return allRecords.flatMap((user) => {
      if (!user.records && !user.userData) {
        return [user];
      }
      return user.records.map((record) => ({
        ...record,
        customerName: user.userData?.customerName || "",
        email1: user.userData?.email1 || "",
        email2: user.userData?.email2 || "",
        mobile1: user.userData?.mobile1 || "",
        mobile2: user.userData?.mobile2 || "",
      }));
    });
  }, [allRecords]);

  const dynamicHeaders = flattenedRecords.reduce((set, record) => {
    Object.keys(record).forEach((key) => set.add(key));
    return set;
  }, new Set(Object.keys(expectedHeaders)));

  const headers = Array.from(dynamicHeaders).filter(
    (key) => key && key.trim() !== "" && key !== "serialno" && key !== "_id"
  );

  const formatValue = (key, value) => {
    if (value === null || value === undefined || value === "") return "-";

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
  const currentPageRecords = filteredRecords.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleImport = (importedData) => {
    setRecords(importedData);
    toast.success("Records imported successfully!");
  };

  const handleExport = () => {
    toast.success(`Exporting ${filteredRecords.length} filtered records`);
    return filteredRecords;
  };

  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      if (setPage) setPage(newPage);
    }
  };

  const categoryOptionsConfig = [
    { key: "status", label: "Status", values: dropdownOptions.status },
    { key: "mode", label: "Payment Mode", values: dropdownOptions.mode },
    { key: "service", label: "Service", values: dropdownOptions.service },
    { key: "handleBy", label: "Handled By" },
    { key: "expert", label: "Expert" },
    { key: "country", label: "Country", values: dropdownOptions.country },
  ];

  useEffect(() => {
    if (onFilter) onFilter(filteredRecords);
  }, [filteredRecords, onFilter]);

  useEffect(() => {
    setFilteredRecords(flattenedRecords);
  }, [flattenedRecords]);

  return (
    <div className="p-6 bg-gradient-to-br from-orange-50 via-white to-orange-100 rounded-2xl shadow-xl mb-8 border border-orange-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#ffd6a5,_transparent),radial-gradient(circle_at_bottom_right,_#ffadad,_transparent)] opacity-30 animate-pulse pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 relative z-10">
        <h2 className="text-2xl font-extrabold text-orange-800 flex items-center gap-2 drop-shadow-sm">
          <Sparkles className="w-6 h-6 text-yellow-500 animate-ping" />
          Admin Sales Lookup
          <span className="text-sm font-normal text-orange-600">
            ({filteredRecords.length} of {flattenedRecords.length} records)
          </span>
        </h2>
        <div className="self-start sm:self-auto">
          <Excel onImport={handleImport} onExport={handleExport} />
        </div>
      </div>

      <div className="bg-white/70 border border-orange-200 backdrop-blur-sm rounded-xl p-3 mb-6 shadow-md relative z-10">
        <Filters
          records={flattenedRecords}
          dateField="dateOfPayment"
          categoryOptionsConfig={categoryOptionsConfig}
          onFilter={(filtered) => {
            // Update the filtered records whenever the Filters component changes
            setFilteredRecords(filtered);
            if (setPage) setPage(1);
          }}
        />
      </div>

      <div className="relative">
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
              {currentPageRecords.length > 0 ? (
                currentPageRecords.map((rec, idx) => (
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
                    className="text-center py-6 text-gray-500 p-6"
                  >
                    No matching records found from {flattenedRecords.length}{" "}
                    total records.
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
              {(() => {
                const startIndex = (page - 1) * itemsPerPage + 1;
                const endIndex = Math.min(
                  page * itemsPerPage,
                  filteredRecords.length
                );
                return `(showing ${startIndex} to ${endIndex} of ${filteredRecords.length} filtered)`;
              })()}
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
    </div>
  );
};

export default AdminSalesLookup;
