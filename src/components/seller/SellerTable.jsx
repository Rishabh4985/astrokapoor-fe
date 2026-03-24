import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import SellerHistoryRecords from "./SellerHistoryRecords";
import {
  gemFieldOrder,
  getGemOptionsForField,
  hasGemSelection,
} from "../../utils/gemsHierarchyUtils";

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
  isSaveDisabled,
  formatValue,
  formatDate,
}) => {
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
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        {/* ================= HEADER ================= */}
        <thead className="sticky top-0 z-10 bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100 text-orange-900">
          <tr>
            <th className="border border-slate-200 px-3 py-3 text-xs font-semibold text-orange-900">
              History
            </th>

            {headers.map((key, index) => (
              <th
                key={key || `header-${index}`}
                className="whitespace-nowrap border border-slate-200 px-4 py-3 text-center font-semibold text-orange-900"
              >
                {headerLabels[key] || key}
                {requiredFields.includes(key) && (
                  <span className="text-red-600 ml-1">*</span>
                )}
              </th>
            ))}

            <th className="border border-slate-200 px-4 py-3 text-xs font-semibold text-orange-900">
              Actions
            </th>
          </tr>
        </thead>

        {/* ================= BODY ================= */}
        <tbody>
          {paginatedRecords.length ? (
            paginatedRecords.map((record) => {
              const isEditing = editingId === record._id;
              const isHistoryExpanded = expandedHistoryId === record._id;

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

                      return (
                        <td
                          key={`${record._id}-${key}-${CellIndex}`}
                          className={`whitespace-nowrap border border-slate-100 px-3 py-2 ${
                            hasError ? "bg-red-50" : ""
                          }`}
                        >
                          {isEditing && !nonEditableFields.includes(key) ? (
                            gemFieldOrder.includes(key) ? (
                              (() => {
                                const keyIndex = gemFieldOrder.indexOf(key);
                                const parentField =
                                  keyIndex > 0
                                    ? gemFieldOrder[keyIndex - 1]
                                    : null;
                                const hasAllParentSelections = gemFieldOrder
                                  .slice(0, keyIndex)
                                  .every((fieldName) =>
                                    hasGemSelection(editedRecord[fieldName]),
                                  );
                                const gemOptions = getGemOptionsForField(
                                  key,
                                  editedRecord,
                                  dropdowns.gemsHierarchy || {},
                                  dropdowns.gems || [],
                                );
                                const isDisabled =
                                  key !== "gems" &&
                                  (!hasAllParentSelections ||
                                    !hasGemSelection(editedRecord[parentField]) ||
                                    gemOptions.length === 0);

                                return (
                                  <select
                                    value={value}
                                    onChange={(e) =>
                                      handleChange(key, e.target.value)
                                    }
                                    disabled={isDisabled}
                                    className="w-full rounded-lg border border-orange-200 p-1 text-xs focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100"
                                  >
                                    <option value="">
                                      {isDisabled
                                        ? "Select parent first"
                                        : `Select ${headerLabels[key] || key}`}
                                    </option>
                                    {gemOptions.map((option, idx) => (
                                      <option
                                        key={`${key}-${option}-${idx}`}
                                        value={option}
                                      >
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                );
                              })()
                            ) : key === "country" ? (
                              <select
                                value={value}
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
                                    value={value}
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
                            ) : Array.isArray(dropdowns?.[key]) ? (
                              <select
                                value={value}
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
                    <td className="border border-slate-100 px-3 py-2">
                      {isEditing ? (
                        <button
                          onClick={() => handleSave(record._id)}
                          disabled={isSaveDisabled()}
                          className={`rounded px-3 py-1 text-sm font-medium ${
                            isSaveDisabled()
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          Save
                        </button>
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
                  </tr>

                  {/* HISTORY */}
                  {isHistoryExpanded && (
                    <SellerHistoryRecords
                      recordId={record._id}
                      headers={headers}
                      history={recordHistory[record._id]}
                      loading={loadingHistory[record._id]}
                      formatDate={formatDate}
                    />
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={headers.length + 2}
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
