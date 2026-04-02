import React from "react";
import { AlertCircle } from "lucide-react";

const SellerHistoryRecords = ({
  recordId,
  headers,
  history = [],
  loading = false,
  formatDate,
}) => {
  if (loading) {
    return (
      <tr className="bg-blue-50 border-b">
        <td colSpan={headers.length + 2} className="p-4 text-center">
          <div className="flex items-center gap-2 text-sm text-blue-600 justify-center">
            <div className="animate-spin">⏳</div>
            Loading history...
          </div>
        </td>
      </tr>
    );
  }

  if (!history || history.length === 0) {
    return (
      <tr className="bg-gray-50 border-b">
        <td colSpan={headers.length + 2} className="p-4 text-center">
          <div className="flex items-center gap-2 text-sm text-gray-600 justify-center">
            <AlertCircle className="w-4 h-4" />
            No changes recorded for this record yet.
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      {history.map((entry, idx) => {
        const rowColor =
          idx === 0
            ? "bg-red-50 border-red-200"
            : idx === 1
            ? "bg-orange-50 border-orange-200"
            : "bg-yellow-50 border-yellow-200";

        const label = idx === 0 ? "LATEST" : idx === 1 ? "PREV" : "OLD";

        return (
          <tr
            key={`${recordId}-history-${entry.changedAt}-${idx}`}
            className={`border-2 ${rowColor}`}
          >
            {/* Left label */}
            <td className="px-3 py-2 border text-xs bg-orange-100 text-orange-900">
              <div className="font-semibold">{label}</div>
              <div className="text-[11px] text-gray-700 mt-1">
                {entry.changedByName || entry.changedBy}
              </div>
            </td>

            {/* History content */}
            <td colSpan={headers.length}>
              <div className="flex flex-col gap-1 text-sm">
                {entry.changes?.length ? (
                  <ul className="space-y-1">
                    {entry.changes.map((change, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="font-medium text-orange-700">
                          {change.fieldLabel || change.field}
                        </span>
                        <span className="text-red-500 line-through">
                          {formatDate(change.oldValue)}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-700 font-semibold">
                          {formatDate(change.newValue)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-500 text-xs">
                    No detailed changes.
                  </span>
                )}

                <div className="text-xs text-gray-600">
                  Changed by{" "}
                  <span className="font-medium text-gray-800">
                    {entry.changedByName || entry.changedBy}
                  </span>{" "}
                  on {new Date(entry.changedAt).toLocaleString("en-IN")}
                </div>
              </div>
            </td>

            {/* Timestamp */}
            <td className="px-3 py-2 border text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-orange-600">
              {new Date(entry.changedAt).toLocaleString("en-IN")}
            </td>
          </tr>
        );
      })}
    </>
  );
};

export default SellerHistoryRecords;
