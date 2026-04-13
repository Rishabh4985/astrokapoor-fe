import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import SellerHistoryRecords from "./SellerHistoryRecords";
import { gemFieldOrder } from "../../utils/utils";

const SellerTable = ({
  headers,
  headerLabels,
  requiredFields,
  paginatedRecords,
  visibleRecords,
  editingId,
  editedRecord,
  validationErrors,
  nonEditableFields,
  dropdowns,
  getStatesByCountry,
  sellerEmail,
  expandedHistoryId,
  recordHistory,
  loadingHistory,
  toggleHistoryExpand,
  handleEdit,
  handleChange,
  handleSave,
  handleCancelEdit,
  isSaveDisabled,
  savingRecordId,
  formatValue,
  formatDate,
  showActions = true,
}) => {
  const multiSelectFields = new Set([
    "service",
    "handleBy",
    "gems",
    "gems1",
    "gems2",
    "gems3",
    "gems4",
  ]);

  const normalizeText = (value) => {
    if (Array.isArray(value)) {
      return value
        .map((item) => normalizeText(item))
        .filter(Boolean)
        .join(",");
    }

    if (value && typeof value === "object") {
      const objectValue = value.name || value.label || value.value || "";
      return objectValue.toString().toLowerCase().trim();
    }

    return (value ?? "").toString().toLowerCase().trim();
  };

  const getOptionValue = (option) => {
    if (option && typeof option === "object") {
      return option.value ?? option.name ?? option.label ?? "";
    }
    return option ?? "";
  };

  const getOptionLabel = (option) => {
    if (option && typeof option === "object") {
      return option.label ?? option.name ?? option.value ?? "";
    }
    return option ?? "";
  };

  const toArrayValue = (value) => {
    if (Array.isArray(value)) {
      return value
        .map((item) => (item === undefined || item === null ? "" : String(item).trim()))
        .filter(Boolean);
    }

    if (value === undefined || value === null || value === "") return [];
    return [String(value).trim()].filter(Boolean);
  };

  const getSelectValue = (rawValue, options = []) => {
    const scalar = Array.isArray(rawValue) ? (rawValue[0] ?? "") : (rawValue ?? "");
    if (scalar === "") return "";

    const normalizedScalar = scalar.toString().trim().toLowerCase();
    const matchedOption = options.find(
      (opt) => getOptionValue(opt).toString().trim().toLowerCase() === normalizedScalar,
    );

    return matchedOption ? getOptionValue(matchedOption) : scalar;
  };

  const toDateInputValue = (value) => {
    if (!value) return "";

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const year = value.getUTCFullYear();
      const month = String(value.getUTCMonth() + 1).padStart(2, "0");
      const day = String(value.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return "";

      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }

      if (trimmed.includes("/")) {
        const [day, month, year] = trimmed.split("/");
        if (day && month && year) {
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
      }

      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        const year = parsed.getUTCFullYear();
        const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
        const day = String(parsed.getUTCDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }

    return "";
  };

  const getOptionsForField = (fieldKey) => {
    if (fieldKey === "country") {
      return (
        dropdowns.country?.map((item) => ({
          label: item.name,
          value: item.name,
        })) || []
      );
    }

    if (gemFieldOrder.includes(fieldKey) || Array.isArray(dropdowns?.[fieldKey])) {
      return (dropdowns[fieldKey] || []).map((option) => {
        if (typeof option === "string") {
          return { label: option, value: option };
        }
        return {
          label: option.label ?? option.name ?? option.value ?? "",
          value: option.value ?? option.name ?? option.label ?? "",
        };
      });
    }

    return [];
  };

  const getColumnMinWidth = (key, options = []) => {
    const headerLength = String(headerLabels[key] || key).length;
    const longestOptionLength = options.reduce((maxLength, option) => {
      const text = String(getOptionLabel(option) || "");
      return Math.max(maxLength, text.length);
    }, 0);

    const base = multiSelectFields.has(key) ? 18 : 10;
    const fromOptions = longestOptionLength > 0
      ? Math.min(44, Math.ceil(longestOptionLength * 0.8) + 8)
      : 0;
    const widthInCh = Math.max(base, headerLength + 4, fromOptions);

    return { minWidth: `${widthInCh}ch` };
  };

  return (
    <div className="records-scrollbar w-full max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-max table-auto divide-y divide-slate-200 text-sm">
        {/* ================= HEADER ================= */}
        <thead className="sticky top-0 z-10 bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 text-orange-900">
          <tr>
            {showActions && (
              <th className="border border-slate-200 px-4 py-3 text-xs font-semibold text-orange-900">
                Actions
              </th>
            )}

            <th className="border border-slate-200 px-3 py-3 text-xs font-semibold text-orange-900">
              History
            </th>

            {headers.map((key, index) => {
              const headerOptions = getOptionsForField(key);
              return (
                <th
                  key={key || `header-${index}`}
                  className="whitespace-nowrap border border-slate-200 px-4 py-3 text-center font-semibold text-orange-900"
                  style={getColumnMinWidth(key, headerOptions)}
                >
                  {headerLabels[key] || key}
                  {requiredFields.includes(key) && (
                    <span className="text-red-600 ml-1">*</span>
                  )}
                </th>
              );
            })}

          </tr>
        </thead>

        {/* ================= BODY ================= */}
        <tbody>
          {paginatedRecords.length ? (
            paginatedRecords.map((record) => {
              const isEditing = editingId === record._id;
              const isHistoryExpanded = expandedHistoryId === record._id;
              const isSavingThisRow = savingRecordId === record._id;

              const categoryValues = normalizeText(record.category)
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean);
              const isConsultation = categoryValues.includes("consultation");
              const handler = normalizeText(record.handlerId);
              const normalizedSellerEmail = normalizeText(sellerEmail);

              const isBlocked =
                !normalizedSellerEmail ||
                (!isConsultation &&
                  handler &&
                  handler !== normalizedSellerEmail);

              return (
                <React.Fragment key={record._id}>
                  <tr className="cursor-pointer border-b border-slate-100 text-center transition-colors hover:bg-orange-50/70">
                    {showActions && (
                      <td className="border border-slate-100 px-3 py-2">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleSave(record._id)}
                              disabled={isSaveDisabled() || isSavingThisRow}
                              className={`rounded px-3 py-1 text-sm font-medium ${
                                isSaveDisabled() || isSavingThisRow
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "text-emerald-600 hover:bg-emerald-50"
                              }`}
                            >
                              {isSavingThisRow ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={isSavingThisRow}
                              className="rounded px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => !isBlocked && handleEdit(record)}
                            disabled={isBlocked}
                            className={`text-xs text-orange-600 hover:underline ${
                              isBlocked ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    )}

                    {/* HISTORY */}
                    <td className="border border-slate-100 px-3 py-2">
                      <button
                        onClick={() => toggleHistoryExpand(record._id)}
                        className="rounded p-1 text-orange-600 transition hover:bg-orange-100"
                      >
                        {isHistoryExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {/* CELLS */}
                    {headers.map((key, CellIndex) => {
                      const hasError = isEditing && validationErrors[key];
                      const rawValue =
                        editedRecord[key] !== undefined &&
                        editedRecord[key] !== null
                          ? editedRecord[key]
                          : (record[key] ?? "");

                      const value =
                        Array.isArray(rawValue)
                          ? rawValue.join(",")
                          : String(rawValue || "");

                      const dateValue =
                        key === "dateOfPayment"
                          ? toDateInputValue(rawValue)
                          : value;
                      const isMultiSelectField = multiSelectFields.has(key);
                      const selectedMultiValues = toArrayValue(rawValue);
                      const selectedMultiValueSet = new Set(selectedMultiValues);

                      return (
                        <td
                          key={`${record._id}-${key}-${CellIndex}`}
                          className={`whitespace-nowrap border border-slate-100 px-3 py-2 ${
                            hasError ? "bg-red-50" : ""
                          }`}
                          style={getColumnMinWidth(key, getOptionsForField(key))}
                        >
                          {isEditing && !nonEditableFields.includes(key) ? (
                            key === "country" ? (
                              <select
                                value={getSelectValue(
                                  rawValue,
                                  dropdowns.country?.map((c) => c.name) || [],
                                )}
                                onChange={(e) =>
                                  handleChange(key, e.target.value)
                                }
                                className="w-full rounded-lg border border-orange-200 p-1 text-xs focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                              >
                                <option value="">Select Country</option>
                                {dropdowns.country?.map((c, idx) => (
                                  <option key={idx} value={c.name}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            ) : key === "state" ? (
                              (() => {
                                const countryObj = dropdowns.country?.find(
                                  (c) =>
                                    normalizeText(c.name) ===
                                    normalizeText(editedRecord.country),
                                );
                                const states = countryObj
                                  ? getStatesByCountry(countryObj.isoCode)
                                  : [];
                                return (
                                  <select
                                    value={getSelectValue(rawValue, states)}
                                    onChange={(e) =>
                                      handleChange(key, e.target.value)
                                    }
                                    disabled={!countryObj}
                                    className="w-full rounded-lg border border-orange-200 p-1 text-xs focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                                  >
                                    <option value="">
                                      {!countryObj
                                        ? "Select country first"
                                      : "Select State"}
                                    </option>
                                    {states.map((s, idx) => (
                                      <option key={idx} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                );
                              })()
                            ) : gemFieldOrder.includes(key) || Array.isArray(dropdowns?.[key]) ? (
                              isMultiSelectField ? (
                                <div className="space-y-1.5 text-left">
                                  <div className="flex min-h-8 flex-wrap gap-1">
                                    {selectedMultiValues.length > 0 ? (
                                      selectedMultiValues.map((selectedValue) => (
                                        <button
                                          key={`${key}-${selectedValue}`}
                                          type="button"
                                          onClick={() =>
                                            handleChange(
                                              key,
                                              selectedMultiValues.filter((item) => item !== selectedValue),
                                            )
                                          }
                                          className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs text-orange-800 hover:bg-orange-100"
                                          title={`Remove ${selectedValue}`}
                                        >
                                          <span>{selectedValue}</span>
                                          <span className="text-[10px] leading-none">x</span>
                                        </button>
                                      ))
                                    ) : (
                                      <span className="text-xs text-slate-400">No selection</span>
                                    )}
                                  </div>

                                  <select
                                    value=""
                                    onChange={(e) => {
                                      const selectedValue = e.target.value;
                                      if (!selectedValue) return;
                                      if (selectedMultiValueSet.has(selectedValue)) return;
                                      handleChange(key, [...selectedMultiValues, selectedValue]);
                                    }}
                                    className={`w-full rounded-lg border p-1 text-xs ${
                                      hasError
                                        ? "border-red-500 bg-red-50"
                                        : "border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                    }`}
                                  >
                                    <option value="">Add {headerLabels[key] || key}</option>
                                    {(dropdowns[key] || []).map((option, idx) => {
                                      const val =
                                        typeof option === "string"
                                          ? option
                                          : option.value;
                                      const label =
                                        typeof option === "string"
                                          ? option
                                          : option.label;
                                      if (selectedMultiValueSet.has(val)) return null;
                                      return (
                                        <option
                                          key={`${key}-${val}-${idx}`}
                                          value={val}
                                        >
                                          {label}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              ) : (
                                <select
                                  value={getSelectValue(rawValue, dropdowns[key] || [])}
                                  onChange={(e) =>
                                    handleChange(key, e.target.value)
                                  }
                                  className={`w-full rounded-lg border p-1 text-xs ${
                                    hasError
                                      ? "border-red-500 bg-red-50"
                                      : "border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                  }`}
                                >
                                  <option value="">
                                    Select {headerLabels[key] || key}
                                  </option>
                                  {(dropdowns[key] || []).map((option, idx) => {
                                    const val =
                                      typeof option === "string"
                                        ? option
                                        : option.value;
                                    const label =
                                      typeof option === "string"
                                        ? option
                                        : option.label;

                                    return (
                                      <option
                                        key={`${key}-${val}-${idx}`}
                                        value={val}
                                      >
                                        {label}
                                      </option>
                                    );
                                  })}
                                </select>
                              )
                            ) : (
                              <input
                                type={key === "dateOfPayment" ? "date" : "text"}
                                value={dateValue}
                                onChange={(e) =>
                                  handleChange(key, e.target.value)
                                }
                                className={`w-full rounded-lg border p-1 text-xs ${
                                  hasError
                                    ? "border-red-500 bg-red-50"
                                    : "border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                }`}
                              />
                            )
                          ) : (
                            formatValue(key, record[key])
                          )}
                        </td>
                      );
                    })}

                    {/* ACTION */}
                  </tr>

                  {/* HISTORY */}
                  {isHistoryExpanded && (
                    <SellerHistoryRecords
                      recordId={record._id}
                      headers={headers}
                      history={recordHistory[record._id]}
                      loading={loadingHistory[record._id]}
                      formatDate={formatDate}
                      showActions={showActions}
                    />
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={headers.length + 1 + (showActions ? 1 : 0)}
                className="py-10 text-center text-slate-500"
              >
                No records found from {visibleRecords.length} total records.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SellerTable;
