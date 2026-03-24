import { useState, useMemo, useEffect, useContext, useRef } from "react";
import { Search, X, Sliders, Check, ChevronDown } from "lucide-react";
import OptionsContext from "../../context/OptionsContext";
import { debounce } from "../../utils/debounce";
import DateField from "./DateField";
import {
  gemFieldOrder,
  getGemOptionsForField,
  clearChildGemFields,
  hasGemSelection,
} from "../../utils/gemsHierarchyUtils";

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
  showSearch = false,
  showAdvancedToggle = true,
}) => {
  const { dropdowns, getStatesByCountry } = useContext(OptionsContext);
  const { filters, setFilters, goToPage } = useContext(context);

  const multiSelectFields = useMemo(
    () => ["service", "handleBy", ...gemFieldOrder],
    [],
  );

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.query || "");
  const [openMultiDropdowns, setOpenMultiDropdowns] = useState({});
  const [optionSearch, setOptionSearch] = useState({});

  const [localFilters, setLocalFilters] = useState({
    query: filters.query || "",
    category: filters.category || "all",
    dateType: "all",
    dateValue: "",
    dateValueEnd: "",
    ...categoryOptionsConfig.reduce((acc, { key }) => {
      if (multiSelectFields.includes(key)) {
        acc[key] = Array.isArray(filters[key])
          ? filters[key]
          : filters[key]
            ? [filters[key]]
            : [];
      } else {
        acc[key] = filters[key] || "";
      }
      return acc;
    }, {}),
  });

  const updateFilter = (key, value) => {
    setLocalFilters((prev) => {
      const next = { ...prev };

      if (multiSelectFields.includes(key)) {
        const currentValues = Array.isArray(prev[key])
          ? prev[key]
          : prev[key]
            ? [prev[key]]
            : [];

        next[key] = currentValues.includes(value)
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value];
      } else {
        next[key] = value;
      }

      if (gemFieldOrder.includes(key)) {
        return clearChildGemFields(key, next);
      }

      return next;
    });
  };

  const removeItemFilter = (field, itemToRemove) => {
    setLocalFilters((prev) => {
      const next = {
        ...prev,
        [field]: Array.isArray(prev[field])
          ? prev[field].filter((item) => item !== itemToRemove)
          : [],
      };

      if (gemFieldOrder.includes(field)) {
        return clearChildGemFields(field, next);
      }

      return next;
    });
  };

  const debouncedSearchRef = useRef(
    debounce((searchQuery) => {
      setLocalFilters((prev) => ({ ...prev, query: searchQuery }));
    }, 500),
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearchRef.current(value);
  };

  useEffect(() => {
    const debouncedSearch = debouncedSearchRef.current;
    return () => {
      debouncedSearch.cancel?.();
    };
  }, []);

  useEffect(() => {
    const incomingQuery = filters.query || "";
    setSearchInput(incomingQuery);
    setLocalFilters((prev) =>
      prev.query === incomingQuery ? prev : { ...prev, query: incomingQuery },
    );
  }, [filters.query]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest('[data-multi-select="true"]')
      ) {
        setOpenMultiDropdowns({});
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenMultiDropdowns({});
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
      if (key === "category") {
        reset[key] = "all";
      } else {
        reset[key] = multiSelectFields.includes(key) ? [] : "";
      }
    });

    debouncedSearchRef.current.cancel?.();
    setSearchInput("");
    setLocalFilters(reset);
    setOpenMultiDropdowns({});
    setOptionSearch({});
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

  const hasActiveFilters = useMemo(
    () =>
      Object.entries(localFilters).some(([, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === "string") return value.trim() !== "" && value !== "all";
        return Boolean(value);
      }),
    [localFilters],
  );

  return (
    <div className="relative z-10 space-y-4 rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {showSearch && (
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={handleSearchChange}
              onBlur={() => debouncedSearchRef.current.flush?.()}
              placeholder="Search records..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        )}

        <select
          value={localFilters.category}
          onChange={(e) =>
            setLocalFilters((prev) => ({ ...prev, category: e.target.value }))
          }
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
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
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Sliders className="w-4 h-4" /> Filters
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className="relative z-20 grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-inner sm:grid-cols-2 lg:grid-cols-4">
          {categoryOptionsConfig.map(({ key, label }) => {
            if (key === "state") return null;

            const keyIndex = gemFieldOrder.indexOf(key);
            const parentField = keyIndex > 0 ? gemFieldOrder[keyIndex - 1] : "";
            const isGemField = keyIndex !== -1;
            const shouldShowGemField =
              !isGemField ||
              key === "gems" ||
              hasGemSelection(localFilters[parentField]);

            if (!shouldShowGemField) return null;

            const options = isGemField
              ? getGemOptionsForField(
                  key,
                  localFilters,
                  dropdowns?.gemsHierarchy || {},
                  dropdowns?.gems || [],
                )
              : fieldOptionsMap[key] || [];

            const isGemDisabled =
              isGemField &&
              key !== "gems" &&
              (!hasGemSelection(localFilters[parentField]) ||
                options.length === 0);

            if (multiSelectFields.includes(key)) {
              const getOptionValue = (option) => {
                if (typeof option === "string") return option;
                if (typeof option === "number") return String(option);
                if (option && typeof option === "object") {
                  return option.name || option.label || option.value || "";
                }
                return "";
              };
              const selectedItems = Array.isArray(localFilters[key])
                ? localFilters[key]
                : localFilters[key]
                  ? [localFilters[key]]
                  : [];
              const searchTerm = (optionSearch[key] || "").toLowerCase();
              const filteredOptions = options.filter((option) =>
                getOptionValue(option).toLowerCase().includes(searchTerm),
              );

              const dropdownOpen = Boolean(openMultiDropdowns[key]);

              return (
                <div key={key}>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                  </label>
                  <div
                    data-multi-select="true"
                    className="relative overflow-visible rounded-xl border border-slate-200 bg-white"
                  >
                    {selectedItems.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 bg-slate-50 p-2">
                        {selectedItems.map((item) => (
                          <div
                            key={item}
                            className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => removeItemFilter(key, item)}
                              className="ml-0.5 text-orange-700 transition hover:text-orange-950"
                              title="Remove"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      onClick={() => {
                        if (isGemDisabled) return;
                        setOpenMultiDropdowns((prev) => ({
                          [key]: !prev[key],
                        }));
                        setOptionSearch((prev) => ({
                          ...prev,
                          [key]: prev[key] || "",
                        }));
                      }}
                      className="flex cursor-pointer items-center justify-between p-2 transition hover:bg-slate-50"
                    >
                      <span className="text-xs text-slate-600">
                        {isGemDisabled
                          ? "Select parent first"
                          : selectedItems.length > 0
                            ? `${selectedItems.length} selected`
                            : `Select ${label.toLowerCase()}`}
                      </span>
                      <span
                        className={`text-xs transition-transform ${
                          dropdownOpen ? "rotate-180" : ""
                        }`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </span>
                    </div>

                    {dropdownOpen && !isGemDisabled && (
                      <div className="absolute left-0 right-0 top-full z-[25] mt-1 max-h-56 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                        <div className="sticky top-0 z-10 bg-white pb-2">
                          <input
                            type="text"
                            value={optionSearch[key] || ""}
                            onChange={(e) =>
                              setOptionSearch((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            placeholder={`Search ${label.toLowerCase()}...`}
                            className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                          />
                        </div>
                        {filteredOptions.map((option, index) => {
                          const value = getOptionValue(option);
                          const isChecked = selectedItems.includes(value);
                          if (!value) return null;

                          return (
                            <label
                              key={`${value}-${index}`}
                              className="flex cursor-pointer items-center gap-2 rounded p-1 transition hover:bg-orange-50"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => updateFilter(key, value)}
                                className="hidden"
                              />
                              {isChecked && (
                                <Check className="w-4 h-4 text-orange-600" />
                              )}
                              <span className="flex-1 text-xs text-slate-700">{value}</span>
                            </label>
                          );
                        })}
                        {filteredOptions.length === 0 && (
                          <div className="px-1 py-2 text-xs text-slate-500">
                            No matching options
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div key={key}>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </label>
                <select
                  value={localFilters[key] || ""}
                  onChange={(e) => updateFilter(key, e.target.value)}
                  disabled={isGemDisabled}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">
                    {isGemDisabled ? "Select parent first" : "All"}
                  </option>
                  {options.map((v, i) => {
                    const value = typeof v === "object" ? v.name : v;
                    return (
                      <option key={value || i} value={value}>
                        {value}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          })}

          {localFilters.country && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                State
              </label>
              {(() => {
                const countryObj = dropdowns.country?.find(
                  (c) =>
                    c.name.toLowerCase() ===
                    (localFilters.country || "").toLowerCase(),
                );
                const states = countryObj
                  ? getStatesByCountry(countryObj.isoCode)
                  : [];

                return (
                  <select
                    value={localFilters.state || ""}
                    onChange={(e) => updateFilter("state", e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="">All States</option>
                    {states?.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                );
              })()}
            </div>
          )}

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Date Filter
            </label>
            <select
              value={localFilters.dateType}
              onChange={(e) => updateFilter("dateType", e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            >
              <option value="all">All Dates</option>
              <option value="date">Specific Date</option>
              <option value="range">Date Range</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>

          {localFilters.dateType === "date" && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Specific Date
              </label>
              <DateField
                type="date"
                value={localFilters.dateValue}
                onChange={(e) => updateFilter("dateValue", e.target.value)}
              />
            </div>
          )}
          {localFilters.dateType === "range" && (
            <>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Start Date
                </label>
                <DateField
                  type="date"
                  value={localFilters.dateValue}
                  onChange={(e) => updateFilter("dateValue", e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  End Date
                </label>
                <DateField
                  type="date"
                  value={localFilters.dateValueEnd}
                  onChange={(e) => updateFilter("dateValueEnd", e.target.value)}
                />
              </div>
            </>
          )}
          {localFilters.dateType === "month" && (
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Month
              </label>
              <DateField
                type="month"
                value={localFilters.dateValue}
                onChange={(e) => updateFilter("dateValue", e.target.value)}
              />
            </div>
          )}
          {localFilters.dateType === "year" && (
            <input
              type="number"
              placeholder="Enter year (e.g. 2026)"
              value={localFilters.dateValue}
              onChange={(e) => updateFilter("dateValue", e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          )}
        </div>
      )}

      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 transition hover:bg-orange-100"
        >
          <X className="w-3 h-3" /> Clear all filters
        </button>
      )}
    </div>
  );
};

export default Filters;

