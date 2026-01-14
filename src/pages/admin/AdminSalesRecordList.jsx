import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { AdminContext } from "../../context/AdminContext";
import Excel from "../../components/shared/Excel";
import { toast } from "react-toastify";
import {
  Search,
  Calendar,
  Filter,
  Tags,
  Table2,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  Lock,
} from "lucide-react";
import {
  dropdownOptions,
  requiredFields,
  headerLabels,
  expectedHeaders,
  hiddenFields,
  nonEditableFields,
} from "../../components/shared/Dropdown";
import { Country, State } from "country-state-city";
import Filters from "../../components/shared/Filters";

const AdminSalesRecordList = ({ onFilter }) => {
  const countryOptions = useMemo(
    () => Country.getAllCountries().map((c) => c.name),
    []
  );
  const stateOptions = useMemo(
    () => State.getAllStates().map((s) => s.name),
    []
  );
  const {
    allRecords,
    setRecords,
    updateRecord,
    deleteRecord,
    error,
    clearError,
  } = useContext(AdminContext);

  const [filteredRecords, setFilteredRecords] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const itemsPerPage = 100;

  const nonCapitalizedFields = ["email1", "email2", "handlerId"];

  const capitalizeValue = (value) => {
    if (!value || typeof value !== "string") return value;
    return value
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getDropdownOptionsForField = (fieldName) => {
    if (fieldName === "country") {
      return countryOptions.map((item) => ({
        label: capitalizeValue(item),
        value: item,
      }));
    }

    if (fieldName === "state") {
      return stateOptions.map((item) => ({
        label: capitalizeValue(item),
        value: item,
      }));
    }
    if (dropdownOptions[fieldName]) {
      if (Array.isArray(dropdownOptions[fieldName])) {
        return dropdownOptions[fieldName].map((item) =>
          typeof item === "string"
            ? { label: item, value: item }
            : { label: item.label, value: item.value }
        );
      }
    }
    return [];
  };

  const getFieldLabel = (fieldName) => {
    return headerLabels[fieldName] || fieldName;
  };

  const isFieldEditable = (fieldName) => {
    return !nonEditableFields.includes(fieldName);
  };

  const validateFieldValue = (fieldName, value) => {
    if (requiredFields.includes(fieldName)) {
      if (!value || (typeof value === "string" && value.trim() === "")) {
        return {
          isValid: false,
          errorMessage: `${getFieldLabel(fieldName)} is required`,
        };
      }
    }
    return { isValid: true, errorMessage: "" };
  };

  const validateRecord = (record) => {
    const errors = {};
    let isValid = true;

    requiredFields.forEach((field) => {
      const validation = validateFieldValue(field, record[field]);
      if (!validation.isValid) {
        errors[field] = validation.errorMessage;
        isValid = false;
      }
    });

    return { isValid, errors };
  };

  const formatValue = (key, value) => {
    if (value === null || value === undefined || value === "") return "-";

    if (typeof value === "object") {
      if (value?.seconds) {
        const date = new Date(value.seconds * 1000);
        return date.toLocaleDateString("en-GB");
      }
      if (value instanceof Date) {
        return value.toLocaleDateString("en-GB");
      }
      if (value.label) return value.label;
      return JSON.stringify(value);
    }

    if (
      key.toLowerCase().includes("date") &&
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      const [year, month, day] = value.split("-");
      return `${day}/${month}/${year}`;
    }

    if (
      key.toLowerCase().includes("amount") ||
      key.toLowerCase().includes("refund") ||
      key.toLowerCase().includes("pending")
    ) {
      return `₹${Number(value).toFixed(2)}`;
    }

    if (
      typeof value === "string" &&
      value.length < 100 &&
      !nonCapitalizedFields.includes(key)
    ) {
      return capitalizeValue(value);
    }

    return String(value);
  };

  const flattenedRecords = useMemo(() => {
    if (!allRecords || allRecords.length === 0) return [];

    if (allRecords.length > 0 && !allRecords[0]?.records) {
      return allRecords;
    }

    return allRecords.flatMap((user) => {
      if (!user.records && !user.userData) return [user];

      return user.records.map((record) => ({
        ...record,
        customerName: user.userData?.customerName || "",
        email1: user.userData?.email1 || "",
        email2: user.userData?.email2 || "",
        mobile1: user.userData?.mobile1 || "",
        mobile2: user.userData?.mobile2 || "",
      }));
    });
  }, [allRecords]);

  const dynamicHeaders = flattenedRecords.reduce((set, record) => {
    Object.keys(record).forEach((key) => set.add(key));
    return set;
  }, new Set(Object.keys(expectedHeaders)));

  const headers = Array.from(dynamicHeaders).filter(
    (key) =>
      key &&
      key.trim() !== "" &&
      key !== "serialno" &&
      key !== "_id" &&
      !hiddenFields.includes(key)
  );

  // ============== PAGINATION ==============
  const totalPagesCalc = Math.ceil(filteredRecords.length / itemsPerPage);
  const currentPageRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const startEdit = (record) => {
    setEditingId(record._id);
    setDraft({ ...record });
    setFieldErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
    setFieldErrors({});
  };

  const handleEditChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));

    // Validate field in real-time
    const validation = validateFieldValue(field, value);
    setFieldErrors((prev) => {
      if (validation.isValid) {
        const { [field]: _, ...rest } = prev;
        return rest;
      } else {
        return { ...prev, [field]: validation.errorMessage };
      }
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const validation = validateRecord(draft);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      toast.error("Please fix all validation errors before saving");
      return;
    }

    const original = flattenedRecords.find((r) => r._id === editingId);
    if (!original) return;

    const partial = {};
    for (const key in draft) {
      if (draft[key] !== original[key]) {
        partial[key] = draft[key];
      }
    }

    if (Object.keys(partial).length === 0) {
      toast.info("No changes detected");
      cancelEdit();
      return;
    }

    try {
      setIsSaving(true);
      await updateRecord(editingId, partial);
      toast.success("Record updated successfully!");
      cancelEdit();
      setFieldErrors({});
    } catch (err) {
      toast.error(err || "Failed to update record");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm(
      "Are you sure you want to delete this record? This action cannot be undone."
    );
    if (!ok) return;

    try {
      setIsDeleting(id);
      await deleteRecord(id);
      toast.success("Record deleted successfully!");
    } catch (err) {
      toast.error(err || "Failed to delete record");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleImport = (importedData) => {
    const validatedData = importedData.map((record) => {
      const validation = validateRecord(record);
      if (!validation.isValid) {
        console.warn(
          "Invalid record found during import:",
          record,
          validation.errors
        );
      }
      return record;
    });

    setRecords(validatedData);
    toast.success(
      `Records imported successfully! (${importedData.length} records)`
    );
  };

  const handleExport = () => {
    if (!filteredRecords || filteredRecords.length === 0) {
      toast.warning("No records available to export");
      return null; // ⬅️ CRITICAL
    }

    toast.success(`Exporting ${filteredRecords.length} records`);
    return filteredRecords;
  };

  useEffect(() => {
    if (onFilter) onFilter(filteredRecords);
  }, [filteredRecords, onFilter]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  useEffect(() => {
    setFilteredRecords(flattenedRecords);
  }, [flattenedRecords]);

  const handleFilter = useCallback((records) => {
    setFilteredRecords(records);
    setCurrentPage(1);
  }, []);

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg mb-8 border border-orange-100">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-orange-800 flex items-center gap-2">
          <Table2 className="w-6 h-6" /> Sales Records
          <span className="text-sm font-normal text-orange-600">
            ({filteredRecords.length} of {flattenedRecords.length} records)
          </span>
        </h2>
        <Excel
          onImport={handleImport}
          onExport={filteredRecords.length ? handleExport : null}
        />
      </div>

      {/* FILTERS */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
        <Filters
          records={flattenedRecords}
          dateField="dateOfPayment"
          onFilter={handleFilter}
          categoryOptionsConfig={[
            { key: "status", label: "Status" },
            { key: "service", label: "Service" },
            { key: "handleBy", label: "Handled By" },
            { key: "mode", label: "Mode" },
            { key: "expert", label: "Expert" },
          ]}
        />
      </div>

      {/* TABLE */}
      <div className="relative rounded-lg border">
        <div className="overflow-auto max-h-[500px] min-h-[300px] rounded-lg border border-orange-300">
          <table className="min-w-full divide-y divide-orange-200 text-sm">
            <thead className="bg-orange-100 text-orange-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 font-medium whitespace-nowrap text-center border-r border-orange-200 w-24 sticky left-0 bg-orange-100 z-20">
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

            {/* Table Body */}
            <tbody>
              {currentPageRecords.length > 0 ? (
                currentPageRecords.map((record, idx) => {
                  const isEditing = record._id === editingId;
                  return (
                    <tr
                      key={idx}
                      className={`${
                        idx % 2 === 0
                          ? "bg-white"
                          : "bg-orange-50 hover:bg-orange-100"
                      } ${isEditing ? "bg-yellow-50" : ""}`}
                    >
                      {/* Actions Column */}
                      <td
                        className={`px-4 py-2 border-r border-orange-200 whitespace-nowrap text-center 
    sticky left-0 z-30
    ${isEditing ? "bg-yellow-50" : idx % 2 === 0 ? "bg-white" : "bg-orange-50"}
  `}
                      >
                        {isEditing ? (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={saveEdit}
                              disabled={
                                isSaving || Object.keys(fieldErrors).length > 0
                              }
                              className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition"
                              title={
                                Object.keys(fieldErrors).length > 0
                                  ? "Fix errors before saving"
                                  : "Save changes"
                              }
                            >
                              {isSaving ? (
                                <span className="w-4 h-4 inline-block border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={isSaving}
                              className="p-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 transition"
                              title="Cancel editing"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => startEdit(record)}
                              className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                              title="Edit record"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(record._id)}
                              disabled={isDeleting === record._id}
                              className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition"
                              title="Delete record"
                            >
                              {isDeleting === record._id ? (
                                <span className="w-4 h-4 inline-block border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Data Columns */}
                      {headers.map((key) => {
                        const hasError = fieldErrors[key];
                        const isEditable = isFieldEditable(key);

                        return (
                          <td
                            key={key}
                            className={`px-4 py-2 border-r border-orange-100 whitespace-nowrap text-center relative ${
                              hasError ? "bg-red-50" : ""
                            }`}
                            title={
                              hasError
                                ? hasError
                                : isEditing
                                ? draft[key]
                                : record[key]
                            }
                          >
                            {isEditing ? (
                              <div className="relative">
                                {isEditable ? (
                                  <>
                                    {getDropdownOptionsForField(key).length >
                                    0 ? (
                                      <select
                                        value={draft[key] ?? ""}
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
                                          (option) => (
                                            <option
                                              key={option.value}
                                              value={option.value}
                                            >
                                              {option.label}
                                            </option>
                                          )
                                        )}
                                      </select>
                                    ) : (
                                      <input
                                        type={
                                          key.toLowerCase().includes("date")
                                            ? "date"
                                            : key
                                                .toLowerCase()
                                                .includes("amount") ||
                                              key
                                                .toLowerCase()
                                                .includes("refund") ||
                                              key
                                                .toLowerCase()
                                                .includes("pending")
                                            ? "number"
                                            : "text"
                                        }
                                        value={draft[key] ?? ""}
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
                                    )}
                                    {hasError && (
                                      <div className="absolute -bottom-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
                                        <AlertCircle className="w-3 h-3 inline mr-1" />
                                        {hasError}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  // NON-EDITABLE FIELD
                                  <div className="flex items-center justify-center gap-1 text-gray-500 text-xs font-semibold py-1 px-2 bg-gray-100 rounded">
                                    <Lock className="w-3 h-3" />
                                    {formatValue(key, draft[key])}
                                  </div>
                                )}
                              </div>
                            ) : (
                              // DISPLAY MODE
                              <div className="flex items-center justify-center gap-1">
                                {!isEditable && (
                                  <Lock className="w-3 h-3 text-gray-400" />
                                )}
                                <span>{formatValue(key, record[key])}</span>
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
                    No matching records found from {flattenedRecords.length}{" "}
                    total records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="sticky bottom-0 bg-white flex justify-center items-center gap-4 py-2 border-t border-orange-300 z-10">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage <= 1}
            className="px-4 py-2 rounded bg-orange-300 text-white font-semibold disabled:opacity-50 hover:bg-orange-400 transition"
          >
            Previous
          </button>
          <span className="flex items-center px-2 font-semibold text-orange-700">
            Page {currentPage} of {totalPagesCalc}
            <span className="text-sm ml-2 text-orange-600">
              {(() => {
                const startIndex = (currentPage - 1) * itemsPerPage + 1;
                const endIndex = Math.min(
                  currentPage * itemsPerPage,
                  filteredRecords.length
                );
                return `(showing ${startIndex} to ${endIndex} of ${filteredRecords.length} filtered)`;
              })()}
            </span>
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPagesCalc))
            }
            disabled={currentPage >= totalPagesCalc}
            className="px-4 py-2 rounded bg-orange-500 text-white font-semibold disabled:opacity-50 hover:bg-orange-600 transition"
          >
            Next
          </button>
        </div>
      </div>

      {/* LEGEND */}
      <div className="mt-4 flex gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <span className="text-red-500 font-bold">*</span>
          <span>Required Field</span>
        </div>
        <div className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-gray-400" />
          <span>Non-Editable Field</span>
        </div>
      </div>
    </div>
  );
};

export default AdminSalesRecordList;
