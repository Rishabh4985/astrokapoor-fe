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
}) => {
  const toDateInputValue = (value) => {
    if (!value) return "";

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const day = String(value.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return "";

      if (trimmed.includes("/")) {
        const [day, month, year] = trimmed.split("/");
        if (day && month && year) {
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
      }

      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, "0");
        const day = String(parsed.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }

    return "";
  };

  return (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">
        <thead className="sticky top-0 z-20 bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 text-orange-900">
          <tr>
            {/* Sticky Actions Header */}
            <th className="sticky left-0 top-0 z-30 w-28 whitespace-nowrap border-r border-slate-200 bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 px-4 py-3 text-center font-semibold">
              Actions
            </th>

            {headers.map((key) => (
              <th
                key={key}
                className="whitespace-nowrap border-r border-slate-200 px-4 py-3 text-center font-semibold"
                title={getFieldLabel(key)}
              >
                {getFieldLabel(key)}
                {requiredFields.includes(key) && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </th>
            ))}
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
                  {/* Actions Column */}
                  <td className="sticky left-0 z-10 whitespace-nowrap border-r border-slate-200 bg-white px-4 py-2 text-center">
                    {renderActions ? renderActions(record, isEditing) : null}
                  </td>

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
                    const isDependentGemField =
                      ["gems1", "gems2", "gems3", "gems4"].includes(key);
                    const isDisabledDropdown =
                      (key === "state" && dropdownOptions.length === 0) ||
                      (isDependentGemField && dropdownOptions.length === 0);

                    return (
                      <td
                        key={key} // safe because headers are unique
                        className={`relative whitespace-nowrap border-r border-slate-100 px-4 py-2 text-center ${
                          hasError ? "bg-red-50" : ""
                        }`}
                        title={hasError ? hasError : currentValue}
                      >
                        {isEditing ? (
                          isEditable ? (
                            shouldRenderDropdown ? (
                              <select
                                value={draft[key] ?? record[key] ?? ""}
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
                                  {isDisabledDropdown
                                    ? "Select parent first"
                                    : `Select ${getFieldLabel(key)}`}
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
                colSpan={headers.length + 1}
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
