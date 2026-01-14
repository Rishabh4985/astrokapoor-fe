import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Calendar, PackageCheck, X, Sliders } from "lucide-react";
import { dropdownOptions } from "./Dropdown";

const Filters = ({
  records = [],
  dateField = "dateOfPayment",
  onFilter,
  categoryOptionsConfig = [
    { key: "status", label: "Status", values: dropdownOptions.status },
    { key: "service", label: "Service", values: dropdownOptions.service },
    { key: "mode", label: "Mode", values: dropdownOptions.mode },
  ],
}) => {
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterValue, setFilterValue] = useState("");
  const [category, setCategory] = useState("all");
  const [fieldFilters, setFieldFilters] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  /* ---------------- Helpers ---------------- */
  const updateFieldFilter = (key, value) => {
    setFieldFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  const getFieldOptions = (key) => {
    if (dropdownOptions[key]?.length) return dropdownOptions[key];
    if (!records.length) return [];
    return [...new Set(records.map((r) => r[key]).filter(Boolean))].sort();
  };

  const parseDate = (value) => {
    if (!value) return null;

    if (value?.seconds) return new Date(value.seconds * 1000);

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return new Date(value);
    }

    if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [dd, mm, yyyy] = value.split("/");
      return new Date(`${yyyy}-${mm}-${dd}`);
    }

    const d = new Date(value);
    return isNaN(d) ? null : d;
  };

  /* ---------------- Date Logic ---------------- */
  const isRecordInDateRange = useCallback(
    (recordDateStr) => {
      if (filterType === "all" || !filterValue) return true;

      const recordDate = parseDate(recordDateStr);
      if (!recordDate) return false;

      switch (filterType) {
        case "date": {
          const selected = parseDate(filterValue);
          return (
            selected && recordDate.toDateString() === selected.toDateString()
          );
        }

        case "month": {
          const [year, month] = filterValue.split("-");
          return (
            recordDate.getFullYear() === Number(year) &&
            recordDate.getMonth() === Number(month) - 1
          );
        }

        case "year":
          return recordDate.getFullYear() === Number(filterValue);

        case "week": {
          const [year, week] = filterValue.split("-W");
          const firstDay = new Date(year, 0, 1);
          const start = new Date(firstDay);
          start.setDate(firstDay.getDate() + (week - 1) * 7);
          const end = new Date(start);
          end.setDate(start.getDate() + 6);
          return recordDate >= start && recordDate <= end;
        }

        default:
          return true;
      }
    },
    [filterType, filterValue]
  );

  /* ---------------- Filtering ---------------- */
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesQuery = Object.values(record).some((val) =>
        String(val ?? "")
          .toLowerCase()
          .includes(query.toLowerCase())
      );

      const matchesDate = isRecordInDateRange(record[dateField]);

      const matchesCategory =
        category === "all" ? true : record.category === category;

      const matchesExtra = Object.entries(fieldFilters).every(
        ([key, value]) =>
          !value ||
          String(record[key] ?? "").toLowerCase() === value.toLowerCase()
      );

      return matchesQuery && matchesDate && matchesCategory && matchesExtra;
    });
  }, [records, query, category, fieldFilters, dateField, isRecordInDateRange]);

  useEffect(() => {
    onFilter?.(filteredRecords);
  }, [filteredRecords, onFilter]);

  /* ---------------- Clear ---------------- */
  const clearAllFilters = () => {
    setQuery("");
    setFilterType("all");
    setFilterValue("");
    setCategory("all");
    setFieldFilters({});
  };

  const hasActiveFilters =
    query ||
    filterType !== "all" ||
    category !== "all" ||
    Object.values(fieldFilters).some(Boolean);

  return (
    <div className="p-4 bg-orange-50 border-b border-orange-200 space-y-3">
      {/* Top Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search records..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>

        {/* Category */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border px-3 py-2 rounded-lg text-sm"
        >
          <option value="all">All Categories</option>
          <option value="Gemstones">Gemstones</option>
          <option value="Consultation">Consultation</option>
          <option value="Products">Products</option>
        </select>

        {/* Date Type */}
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setFilterValue("");
          }}
          className="border px-3 py-2 rounded-lg text-sm"
        >
          <option value="all">Any Date</option>
          <option value="date">Date</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>

        {/* Date Value */}
        {filterType !== "all" && (
          <input
            type={
              filterType === "date"
                ? "date"
                : filterType === "week"
                ? "week"
                : filterType === "month"
                ? "month"
                : "number"
            }
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder="Year"
            className="border px-3 py-2 rounded-lg text-sm w-[140px]"
          />
        )}

        {/* Advanced Toggle */}
        <button
          onClick={() => setShowAdvanced((p) => !p)}
          className="flex items-center gap-2 border px-3 py-2 rounded-lg text-sm text-orange-700"
        >
          <Sliders className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && categoryOptionsConfig.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white border rounded-lg">
          {categoryOptionsConfig.map(({ key, label, values = [] }) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-600">
                {label}
              </label>
              <select
                value={fieldFilters[key] || ""}
                onChange={(e) => updateFieldFilter(key, e.target.value)}
                className="w-full border px-3 py-2 rounded-lg text-sm"
              >
                <option value="">All</option>
                {(values?.length ? values : getFieldOptions(key)).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="flex items-center gap-1 text-xs text-orange-600"
        >
          <X className="w-3 h-3" /> Clear all filters
        </button>
      )}
    </div>
  );
};

export default Filters;
