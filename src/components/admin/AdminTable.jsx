import React from "react";
import { Lock } from "lucide-react";

const AdminTable = ({
  headers,
  records,
  editingId,
  draft,
  fieldErrors,
  requiredFields,
  isFieldEditable,
  getFieldLabel,
  getDropdownOptionsForField,
  isDropdownField,
  formatValue,
  handleEditChange,
  renderActions,
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

  const getOptionValue = (option) => {
    if (option && typeof option === "object") {
      return option.value ?? "";
    }
    return option ?? "";
  };

  const getOptionLabel = (option) => {
    if (option && typeof option === "object") {
      return option.label ?? option.value ?? "";
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

  const getColumnMinWidth = (key, options = []) => {
    const headerLength = String(getFieldLabel(key) || key).length;
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

  return (
    <div className="records-scrollbar w-full max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-max table-auto divide-y divide-slate-200 text-sm">
        <thead className="sticky top-0 z-20 bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 text-orange-900">
          <tr>
            {showActions && (
              <th className="sticky left-0 top-0 z-30 w-28 whitespace-nowrap border-r border-slate-200 bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 px-4 py-3 text-center font-semibold">
                Actions
              </th>
            )}

            {headers.map((key) => {
              const headerOptions = getDropdownOptionsForField(key);
              return (
                <th
                  key={key}
                  className="whitespace-nowrap border-r border-slate-200 px-4 py-3 text-center font-semibold"
                  title={getFieldLabel(key)}
                  style={getColumnMinWidth(key, headerOptions)}
                >
                  {getFieldLabel(key)}
                  {requiredFields.includes(key) && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {records.length > 0 ? (
            records.map((record, idx) => {
              const isEditing = record._id === editingId;

              return (
                <tr
                  key={record._id ?? `${record.customerName}-${idx}`} // unique row key
                  className={`${
                    idx % 2 === 0
                      ? "bg-white"
                      : "bg-orange-50/40"
                  } transition-colors hover:bg-orange-50 ${isEditing ? "bg-amber-50" : ""}`}
                >
                  {showActions && (
                    <td className="sticky left-0 z-10 whitespace-nowrap border-r border-slate-200 bg-white px-4 py-2 text-center">
                      {renderActions ? renderActions(record, isEditing) : null}
                    </td>
                  )}

                  {/* Data Columns */}
                  {headers.map((key) => {
                    const hasError = fieldErrors[key];
                    const isEditable = isFieldEditable(key);
                    const isDateField = key.toLowerCase().includes("date");

                    // Use draft value if editing, else original value
                    const currentValue = isEditing
                      ? (draft[key] ?? record[key] ?? "")
                      : record[key];
                    const dateValue = isDateField
                      ? toDateInputValue(currentValue)
                      : (currentValue ?? "");

                    const dropdownOptions = getDropdownOptionsForField(key);
                    const shouldRenderDropdown =
                      dropdownOptions.length > 0 || isDropdownField?.(key);
                    const isDisabledDropdown =
                      key === "state" && dropdownOptions.length === 0;
                    const isMultiSelectField = multiSelectFields.has(key);
                    const selectedMultiValues = toArrayValue(
                      draft[key] ?? record[key] ?? [],
                    );
                    const selectedMultiValueSet = new Set(selectedMultiValues);

                    return (
                      <td
                        key={key} // safe because headers are unique
                        className={`relative whitespace-nowrap border-r border-slate-100 px-4 py-2 text-center ${
                          hasError ? "bg-red-50" : ""
                        }`}
                        title={hasError ? hasError : currentValue}
                        style={getColumnMinWidth(key, dropdownOptions)}
                      >
                        {isEditing ? (
                          isEditable ? (
                            shouldRenderDropdown ? (
                              isMultiSelectField ? (
                                <div className="space-y-1.5 text-left">
                                  <div className="flex min-h-8 flex-wrap gap-1">
                                    {selectedMultiValues.length > 0 ? (
                                      selectedMultiValues.map((value) => (
                                        <button
                                          key={value}
                                          type="button"
                                          onClick={() =>
                                            handleEditChange(
                                              key,
                                              selectedMultiValues.filter((item) => item !== value),
                                            )
                                          }
                                          className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs text-orange-800 hover:bg-orange-100"
                                          title={`Remove ${value}`}
                                        >
                                          <span>{value}</span>
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
                                      handleEditChange(key, [...selectedMultiValues, selectedValue]);
                                    }}
                                    disabled={isDisabledDropdown}
                                    className={`w-full rounded-lg border px-2 py-1 text-sm focus:ring-2 ${
                                      hasError
                                        ? "border-red-500 focus:ring-red-400"
                                        : "border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                                    } disabled:bg-slate-100`}
                                  >
                                    <option value="">{`Add ${getFieldLabel(key)}`}</option>
                                    {dropdownOptions.map((opt, idxOpt) => {
                                      const optionValue = getOptionValue(opt);
                                      if (selectedMultiValueSet.has(optionValue)) return null;
                                      return (
                                        <option
                                          key={`${optionValue}-${idxOpt}`}
                                          value={optionValue}
                                        >
                                          {getOptionLabel(opt)}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </div>
                              ) : (
                                <select
                                  value={getSelectValue(draft[key] ?? record[key] ?? "", dropdownOptions)}
                                  onChange={(e) =>
                                    handleEditChange(key, e.target.value)
                                  }
                                  disabled={isDisabledDropdown}
                                  className={`w-full rounded-lg border px-2 py-1 text-sm focus:ring-2 ${
                                    hasError
                                      ? "border-red-500 focus:ring-red-400"
                                      : "border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                                  } disabled:bg-slate-100`}
                                >
                                  <option value="">
                                    {`Select ${getFieldLabel(key)}`}
                                  </option>
                                  {dropdownOptions.map((opt, idxOpt) => (
                                    <option
                                      key={`${opt.value}-${idxOpt}`}
                                      value={opt.value}
                                    >
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              )
                            ) : (
                              <input
                                type={
                                  isDateField
                                    ? "date"
                                    : key.toLowerCase().includes("amount") ||
                                        key.toLowerCase().includes("refund") ||
                                        key.toLowerCase().includes("pending")
                                      ? "number"
                                      : "text"
                                }
                                value={dateValue}
                                onChange={(e) =>
                                  handleEditChange(key, e.target.value)
                                }
                                className={`w-full px-2 py-1 border rounded text-sm focus:ring-2 ${
                                  hasError
                                    ? "border-red-500 focus:ring-red-400"
                                    : "border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                                }`}
                                placeholder="-"
                              />
                            )
                          ) : (
                            <div className="flex items-center justify-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                              <Lock className="w-3 h-3" />
                              {formatValue(key, currentValue)}
                            </div>
                          )
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            {!isEditable && (
                              <Lock className="w-3 h-3 text-gray-400" />
                            )}
                            <span>{formatValue(key, currentValue)}</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={headers.length + (showActions ? 1 : 0)}
                className="py-10 text-center text-slate-500"
              >
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminTable;
