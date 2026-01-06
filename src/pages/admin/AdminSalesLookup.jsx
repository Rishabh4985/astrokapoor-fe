import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { AdminContext } from "../../context/AdminContext";
import Excel from "../../components/shared/Excel";
import { toast } from "react-toastify";
import { Search, Calendar, Filter, Table2, Sparkles, Tags } from "lucide-react";
import {
  expectedHeaders,
  headerLabels,
} from "../../components/shared/Dropdown";

const AdminSalesLookup = ({ onFilter }) => {
  const {
    allRecords,
    setRecords,
    page,
    setPage,
    itemsPerPage = 100,
  } = useContext(AdminContext);

  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterValue, setFilterValue] = useState("");
  const [categoryKey, setCategoryKey] = useState("");
  const [categoryValue, setCategoryValue] = useState("");
  const [category, setCategory] = useState("all");

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

  const isRecordInDateRange = useCallback(
    (recordDateStr) => {
      if (!filterType || filterType === "all" || !filterValue) return true;
      const recordDate = new Date(recordDateStr);
      if (isNaN(recordDate)) return false;

      switch (filterType) {
        case "date": {
          const selected = new Date(filterValue);
          return (
            recordDate.getFullYear() === selected.getFullYear() &&
            recordDate.getMonth() === selected.getMonth() &&
            recordDate.getDate() === selected.getDate()
          );
        }
        case "week": {
          const [year, weekNumber] = filterValue.split("-W");
          const firstDayOfYear = new Date(year, 0, 1);
          const days = (parseInt(weekNumber) - 1) * 7;
          const weekStart = new Date(
            firstDayOfYear.setDate(firstDayOfYear.getDate() + days)
          );
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return recordDate >= weekStart && recordDate <= weekEnd;
        }
        case "month": {
          const [year, month] = filterValue.split("-");
          return (
            recordDate.getFullYear() === parseInt(year) &&
            recordDate.getMonth() === parseInt(month) - 1
          );
        }
        case "year":
          return recordDate.getFullYear() === parseInt(filterValue);
        default:
          return true;
      }
    },
    [filterType, filterValue]
  );

  // Apply ALL filters to ALL records
  const filteredRecords = useMemo(() => {
    return flattenedRecords.filter((record) => {
      const matchesQuery = Object.values(record).some((val) =>
        String(val || "")
          .toLowerCase()
          .includes(query.toLowerCase())
      );

      const matchesDate = isRecordInDateRange(record.dateOfPayment);

      const matchesMainCategory =
        category === "all" ? true : record.category === category;

      const matchesExtraCategory =
        !categoryKey || !categoryValue
          ? true
          : String(record[categoryKey] || "").toLowerCase() ===
            categoryValue.toLowerCase();

      return (
        matchesQuery &&
        matchesDate &&
        matchesMainCategory &&
        matchesExtraCategory
      );
    });
  }, [
    flattenedRecords,
    query,
    category,
    categoryKey,
    categoryValue,
    isRecordInDateRange,
  ]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const currentPageRecords = filteredRecords.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  useEffect(() => {
    if (setPage) setPage(1);
  }, [
    query,
    filterType,
    filterValue,
    category,
    categoryKey,
    categoryValue,
    setPage,
  ]);

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

  useEffect(() => {
    if (onFilter) onFilter(filteredRecords);
  }, [filteredRecords, onFilter]);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 w-4 h-4" />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-1.5 rounded-md border border-orange-300 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-500"
              placeholder="Search across all records..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="relative w-full">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 w-4 h-4" />
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setFilterValue("");
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-md border border-orange-300 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-500 appearance-none"
            >
              <option value="all">All Dates</option>
              <option value="date">By Date</option>
              <option value="week">By Week</option>
              <option value="month">By Month</option>
              <option value="year">By Year</option>
            </select>
          </div>

          {filterType === "date" && (
            <input
              type="date"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="px-2 py-1.5 border border-orange-300 rounded-md text-sm"
            />
          )}
          {filterType === "week" && (
            <input
              type="week"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="px-2 py-1.5 border border-orange-300 rounded-md text-sm"
            />
          )}
          {filterType === "month" && (
            <input
              type="month"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="px-2 py-1.5 border border-orange-300 rounded-md text-sm"
            />
          )}
          {filterType === "year" && (
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="px-2 py-1.5 border border-orange-300 rounded-md text-sm"
            >
              <option value="">Select Year</option>
              {Array.from({ length: 15 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          )}

          <div className="relative w-full flex items-center gap-2">
            <Tags className="w-4 h-4 text-orange-600" />
            <span className="font-semibold text-orange-800">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border rounded px-3 py-1 bg-white text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="Select category"
            >
              <option value="all">All</option>
              <option value="gemstones">Gemstones</option>
              <option value="products">Products</option>
              <option value="consultation">Consultation</option>
            </select>
          </div>

          <div className="relative w-full">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 w-4 h-4" />
            <select
              value={categoryKey}
              onChange={(e) => {
                setCategoryKey(e.target.value);
                setCategoryValue("");
              }}
              className="w-full pl-9 pr-3 py-1.5 rounded-md border border-orange-300 text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-500 appearance-none"
            >
              <option value="">Filter by Category</option>
              <option value="status">Status</option>
              <option value="service">Service</option>
              <option value="handleBy">Handled By</option>
              <option value="mode">Mode</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          {categoryKey && (
            <select
              value={categoryValue}
              onChange={(e) => setCategoryValue(e.target.value)}
              className="px-2 py-1.5 border border-orange-300 rounded-md text-sm"
            >
              <option value="">Select {categoryKey}</option>
              {[...new Set(flattenedRecords.map((r) => r[categoryKey]))]
                .filter((v) => v)
                .sort()
                .map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
            </select>
          )}
        </div>
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
