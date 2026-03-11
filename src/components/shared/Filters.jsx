import { useState, useMemo, useEffect, useContext } from "react";
import { Search, X, Sliders } from "lucide-react";
import OptionsContext from "../../context/OptionsContext";

const Filters = ({
  context,
  categoryOptionsConfig = [
    { key: "status", label: "Status" },
    { key: "service", label: "Service" },
    { key: "mode", label: "Mode" },
    { key: "category", label: "Category" },
    { key: "expert", label: "Expert" },
    { key: "handleBy", label: "Handled By" },
    { key: "country", label: "Country" },
    { key: "state", label: "State" },
  ],
  showSearch = true,
  showAdvancedToggle = true,
}) => {
  const { dropdowns } = useContext(OptionsContext);
  const { filters, setFilters, goToPage } = useContext(context);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const [localFilters, setLocalFilters] = useState({
    query: filters.query || "",
    category: filters.category || "all",
    dateType: "all",
    dateValue: "",
    dateValueEnd: "",
    ...categoryOptionsConfig.reduce((acc, { key }) => {
      acc[key] = filters[key] || "";
      return acc;
    }, {}),
  });

  const updateFilter = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const fieldOptionsMap = useMemo(() => {
    const map = {};
    categoryOptionsConfig.forEach(({ key }) => {
      map[key] = dropdowns?.[key] || [];
    });
    map.category = dropdowns?.category || [];
    return map;
  }, [dropdowns, categoryOptionsConfig]);

  const clearAllFilters = () => {
    const reset = {
      query: "",
      category: "all",
      dateType: "all",
      dateValue: "",
      dateValueEnd: "",
    };

    categoryOptionsConfig.forEach(({ key }) => {
      reset[key] = "";
    });

    setLocalFilters(reset);
    setFilters({});
  };

  useEffect(() => {
    const mapped = { ...localFilters };

    if (mapped.dateType === "date") mapped.date = mapped.dateValue;

    if (mapped.dateType === "range") {
      mapped.startDate = mapped.dateValue;
      mapped.endDate = mapped.dateValueEnd;
    }

    if (mapped.dateType === "month") mapped.month = mapped.dateValue;

    if (mapped.dateType === "year") mapped.year = mapped.dateValue;

    delete mapped.dateType;
    delete mapped.dateValue;
    delete mapped.dateValueEnd;

    setFilters(mapped);
    goToPage(1);
  }, [localFilters, setFilters, goToPage]);

  const hasActiveFilters = Object.values(localFilters).some(
    (v) => v && v !== "all",
  );

  return (
    <div className="p-4 bg-orange-50 border-b border-orange-200 space-y-3">
      {/* TOP BAR */}
      <div className="flex flex-wrap gap-3 items-center">
        {showSearch && (
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-600" />
            <input
              value={localFilters.query}
              onChange={(e) => updateFilter("query", e.target.value)}
              placeholder="Search records..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
        )}

        <select
          value={localFilters.category}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="border px-3 py-2 rounded-lg text-sm"
        >
          <option value="all">All Categories</option>
          {(fieldOptionsMap.category || []).map((v, i) => {
            const value = typeof v === "object" ? v.name : v;
            return (
              <option key={value || i} value={value}>
                {value}
              </option>
            );
          })}
        </select>

        {showAdvancedToggle && (
          <button
            onClick={() => setShowAdvanced((p) => !p)}
            className="flex items-center gap-2 border px-3 py-2 rounded-lg text-sm text-orange-700"
          >
            <Sliders className="w-4 h-4" /> Filters
          </button>
        )}
      </div>

      {/* ADVANCED FILTERS */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white border rounded-lg">
          {categoryOptionsConfig.map(({ key, label }) => (
            <div key={key}>
              <label className="text-xs font-medium text-gray-600">
                {label}
              </label>

              <select
                value={localFilters[key]}
                onChange={(e) => updateFilter(key, e.target.value)}
                className="w-full border px-3 py-2 rounded-lg text-sm"
              >
                <option value="">All</option>

                {(fieldOptionsMap[key] || []).map((v, i) => {
                  const value = typeof v === "object" ? v.name : v;
                  return (
                    <option key={value || i} value={value}>
                      {value}
                    </option>
                  );
                })}
              </select>
            </div>
          ))}

          {/* DATE FILTER */}
          <div>
            <label className="text-xs font-medium text-gray-600">
              Date Filter
            </label>

            <select
              value={localFilters.dateType}
              onChange={(e) => updateFilter("dateType", e.target.value)}
              className="w-full border px-3 py-2 rounded-lg text-sm"
            >
              <option value="all">All Dates</option>
              <option value="date">Specific Date</option>
              <option value="range">Date Range</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>

          {localFilters.dateType === "date" && (
            <input
              type="date"
              value={localFilters.dateValue}
              onChange={(e) => updateFilter("dateValue", e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm"
            />
          )}

          {localFilters.dateType === "range" && (
            <>
              <input
                type="date"
                value={localFilters.dateValue}
                onChange={(e) => updateFilter("dateValue", e.target.value)}
                className="border px-3 py-2 rounded-lg text-sm"
              />
              <input
                type="date"
                value={localFilters.dateValueEnd}
                onChange={(e) => updateFilter("dateValueEnd", e.target.value)}
                className="border px-3 py-2 rounded-lg text-sm"
              />
            </>
          )}

          {localFilters.dateType === "month" && (
            <input
              type="month"
              value={localFilters.dateValue}
              onChange={(e) => updateFilter("dateValue", e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm"
            />
          )}

          {localFilters.dateType === "year" && (
            <input
              type="number"
              placeholder="Enter year (e.g. 2026)"
              value={localFilters.dateValue}
              onChange={(e) => updateFilter("dateValue", e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm"
            />
          )}
        </div>
      )}

      {/* CLEAR */}
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
