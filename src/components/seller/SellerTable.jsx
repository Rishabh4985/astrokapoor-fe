import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import SellerHistoryRecords from "./SellerHistoryRecords";

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
  countryOptions,
  stateOptions,
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
  return (
    <div className="overflow-auto max-h-[600px] min-h-[300px] border border-orange-300 rounded-lg">
      <table className="min-w-full divide-y divide-orange-200 text-sm">
        {/* ================= HEADER ================= */}
        <thead className="bg-orange-100 text-orange-800 sticky top-0 z-10">
          <tr>
            <th className="px-3 py-2 border text-xs font-semibold text-orange-900">
              History
            </th>

            {headers.map((key, index) => (
              <th
                key={key || `header-${index}`}
                className="px-4 py-2 border font-medium text-center text-orange-900 whitespace-nowrap"
              >
                {headerLabels[key] || key}
                {requiredFields.includes(key) && (
                  <span className="text-red-600 ml-1">*</span>
                )}
              </th>
            ))}

            <th className="px-4 py-2 border text-xs font-semibold text-orange-900">
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

              const cat = (record.category || "").toLowerCase().trim();
              const handler = (record.handlerId || "").toLowerCase().trim();

              const isBlocked =
                !sellerEmail ||
                (cat !== "consultation" && handler && handler !== sellerEmail);

              return (
                <React.Fragment key={record._id}>
                  <tr className="hover:bg-orange-50 border-b text-center cursor-pointer">
                    {/* HISTORY */}
                    <td className="px-3 py-2 border">
                      <button
                        onClick={() => toggleHistoryExpand(record._id)}
                        className="text-blue-600 hover:bg-blue-50 p-1 rounded"
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

                      const value =
                        editedRecord[key] !== undefined &&
                        editedRecord[key] !== null
                          ? String(editedRecord[key] || "")
                          : String(record[key] || "");

                      return (
                        <td
                          key={`${record._id}-${key}-${CellIndex}`}
                          className={`px-3 py-2 border whitespace-nowrap ${
                            hasError ? "bg-red-50" : ""
                          }`}
                        >
                          {isEditing && !nonEditableFields.includes(key) ? (
                            dropdowns?.[key] ? (
                              <select
                                value={value}
                                onChange={(e) =>
                                  handleChange(key, e.target.value)
                                }
                                className={`border rounded p-1 w-full text-xs ${
                                  hasError
                                    ? "border-red-500 bg-red-50"
                                    : "border-orange-300"
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
                            ) : key === "country" ? (
                              <select
                                value={value}
                                onChange={(e) =>
                                  handleChange(key, e.target.value)
                                }
                                className="border rounded p-1 w-full text-xs border-orange-300"
                              >
                                <option value="">Select Country</option>
                                {countryOptions.map((c, idx) => (
                                  <option key={idx} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            ) : key === "state" ? (
                              <select
                                value={value}
                                onChange={(e) =>
                                  handleChange(key, e.target.value)
                                }
                                className="border rounded p-1 w-full text-xs border-orange-300"
                              >
                                <option value="">Select State</option>
                                {stateOptions.map((s, idx) => (
                                  <option key={idx} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={value}
                                onChange={(e) =>
                                  handleChange(key, e.target.value)
                                }
                                className={`border rounded p-1 w-full text-xs ${
                                  hasError
                                    ? "border-red-500 bg-red-50"
                                    : "border-orange-300"
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
                    <td className="px-3 py-2 border">
                      {isEditing ? (
                        <button
                          onClick={() => handleSave(record._id)}
                          disabled={isSaveDisabled()}
                          className={`text-sm font-medium px-3 py-1 rounded ${
                            isSaveDisabled()
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          onClick={() => !isBlocked && handleEdit(record)}
                          disabled={isBlocked}
                          className={`text-blue-600 hover:underline text-xs ${
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
                className="text-center text-gray-500 py-6"
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
