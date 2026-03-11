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
  formatValue,
  handleEditChange,
  renderActions,
}) => {
  return (
    <div className="border rounded-lg overflow-auto max-h-[500px] min-h-[300px]">
      <table className="min-w-full divide-y divide-orange-200 text-sm table-fixed">
        <thead className="bg-orange-100 text-orange-800 sticky top-0 z-30">
          <tr>
            {/* Sticky Actions Header */}
            <th className="px-4 py-2 font-medium whitespace-nowrap text-center border-r border-orange-200 w-28 sticky top-0 left-0 bg-orange-100 z-40">
              Actions
            </th>

            {headers.map((key) => (
              <th
                key={key}
                className="px-4 py-2 font-medium whitespace-nowrap text-center border-r border-orange-200"
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
                      : "bg-orange-50 hover:bg-orange-100"
                  } ${isEditing ? "bg-yellow-50" : ""}`}
                >
                  {/* Actions Column */}
                  <td className="px-4 py-2 border-r border-orange-200 whitespace-nowrap text-center sticky left-0 bg-white z-20">
                    {renderActions ? renderActions(record, isEditing) : null}
                  </td>

                  {/* Data Columns */}
                  {headers.map((key) => {
                    const hasError = fieldErrors[key];
                    const isEditable = isFieldEditable(key);

                    // Use draft value if editing, else original value
                    const currentValue = isEditing
                      ? (draft[key] ?? record[key] ?? "")
                      : record[key];

                    return (
                      <td
                        key={key} // safe because headers are unique
                        className={`px-4 py-2 border-r border-orange-100 whitespace-nowrap text-center relative ${
                          hasError ? "bg-red-50" : ""
                        }`}
                        title={hasError ? hasError : currentValue}
                      >
                        {isEditing ? (
                          isEditable ? (
                            getDropdownOptionsForField(key).length > 0 ? (
                              <select
                                value={draft[key] ?? record[key] ?? ""}
                                onChange={(e) =>
                                  handleEditChange(key, e.target.value)
                                }
                                className={`w-full px-2 py-1 border rounded text-sm focus:ring-2 ${
                                  hasError
                                    ? "border-red-500 focus:ring-red-400"
                                    : "border-blue-300 focus:ring-blue-400"
                                }`}
                              >
                                <option value="">
                                  Select {getFieldLabel(key)}
                                </option>
                                {getDropdownOptionsForField(key).map(
                                  (opt, idxOpt) => (
                                    <option
                                      key={`${opt.value}-${idxOpt}`}
                                      value={opt.value}
                                    >
                                      {opt.label}
                                    </option>
                                  ),
                                )}
                              </select>
                            ) : (
                              <input
                                type={
                                  key.toLowerCase().includes("date")
                                    ? "date"
                                    : key.toLowerCase().includes("amount") ||
                                        key.toLowerCase().includes("refund") ||
                                        key.toLowerCase().includes("pending")
                                      ? "number"
                                      : "text"
                                }
                                value={draft[key] ?? record[key] ?? ""}
                                onChange={(e) =>
                                  handleEditChange(key, e.target.value)
                                }
                                className={`w-full px-2 py-1 border rounded text-sm focus:ring-2 ${
                                  hasError
                                    ? "border-red-500 focus:ring-red-400"
                                    : "border-blue-300 focus:ring-blue-400"
                                }`}
                                placeholder="-"
                              />
                            )
                          ) : (
                            <div className="flex items-center justify-center gap-1 text-gray-500 text-xs font-semibold py-1 px-2 bg-gray-100 rounded">
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
                className="text-center text-gray-500 py-6"
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
