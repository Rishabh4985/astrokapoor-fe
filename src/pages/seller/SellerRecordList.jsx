import React, { useContext, useEffect, useState, useMemo } from "react";
import { SellerContext } from "../../context/SellerContext";
import Excel from "../../components/shared/Excel";
import { toast } from "react-toastify";
import {
  Search,
  Filter,
  ClipboardEdit,
  Globe,
  UserCheck,
  Send,
  XCircle,
  Table2,
  AlertCircle,
  History,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Country, State } from "country-state-city";
import {
  dropdownOptions,
  requiredFields,
  expectedHeaders,
  headerLabels,
  nonEditableFields,
  hiddenFields,
} from "../../components/shared/Dropdown.js";

const statusOptions = dropdownOptions.status;
const categoryOptions = dropdownOptions.category;
const serviceOptions = dropdownOptions.service;
const modeOptions = dropdownOptions.mode;

const SellerRecordList = ({ onFilter }) => {
  const countryOptions = useMemo(
    () => Country.getAllCountries().map((c) => c.name),
    []
  );
  const stateOptions = useMemo(
    () => State.getAllStates().map((s) => s.name),
    []
  );
  const { sellerRecords, updateSellerRecord, getRecordHistory } =
    useContext(SellerContext);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null); // use id instead of index
  const [editedRecord, setEditedRecord] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [recordHistory, setRecordHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  const [filters, setFilters] = useState({
    status: "",
    service: "",
    country: "",
    expert: "",
    mode: "",
  });

  const currentSeller = JSON.parse(localStorage.getItem("currentSeller"));
  const sellerEmail = currentSeller?.email?.toLowerCase().trim();

  const visibleRecords = useMemo(() => {
    return Array.isArray(sellerRecords) ? sellerRecords : [];
  }, [sellerRecords]);

  const filteredRecords = useMemo(() => {
    return visibleRecords.filter((record) => {
      const matchesQuery = Object.values(record).some((val) =>
        String(val || "")
          .toLowerCase()
          .includes(query.toLowerCase())
      );

      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const recordVal = record[key];
        if (recordVal === null || recordVal === undefined) return false;
        return String(recordVal).toLowerCase() === value.toLowerCase();
      });

      return matchesQuery && matchesFilters;
    });
  }, [visibleRecords, query, filters]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRecords.length / itemsPerPage)
  );

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, itemsPerPage, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, filters]);

  useEffect(() => {
    if (onFilter) onFilter(filteredRecords);
  }, [filteredRecords, onFilter]);

  const dynamicHeaders = visibleRecords.reduce((set, record) => {
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

  const validateRecord = (record) => {
    const errors = {};

    requiredFields.forEach((field) => {
      const value = record[field];

      if (
        !value ||
        (typeof value === "string" && value.trim() === "") ||
        value === null ||
        value === undefined
      ) {
        errors[field] = `${headerLabels[field] || field} is required.`;
      }
    });
    return errors;
  };

  const isSaveDisabled = () => {
    return Object.keys(validationErrors).length > 0;
  };

  const formatValue = (key, value) => {
    if (value === null || value === undefined || value === "") return "-";
    if (key === "category" && typeof value === "string") {
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }

    if (key === "country" && typeof value === "string") {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }

    if (key === "state" && typeof value === "string") {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
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
    return value;
  };

  const handleExport = () => {
    toast.success(`Exporting ${filteredRecords.length} filtered records`);
    return filteredRecords;
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setEditedRecord({
      ...record,
      category: record.category
        ? String(record.category).toLowerCase().trim()
        : record.category,
    });
    setValidationErrors({});
  };

  const handleChange = (key, value) => {
    setEditedRecord((prev) => ({ ...prev, [key]: value }));

    if (requiredFields.includes(key)) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };

        if (!value || (typeof value === "string" && value.trim() === "")) {
          newErrors[key] = `${headerLabels[key] || key} is required.`;
        } else {
          delete newErrors[key];
        }
        return newErrors;
      });
    }
  };

  const handleSave = async (recordId) => {
    const recordToSave = paginatedRecords.find((r) => r._id === recordId);
    if (!recordToSave || !recordToSave._id) {
      toast.error("Record data is incomplete. Please reload and try again.");
      return;
    }

    const recordWithEdits = { ...recordToSave, ...editedRecord };
    const errors = validateRecord(recordWithEdits);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const missingFields = Object.keys(errors).join(", ");
      toast.error(`Please fill all required fields: ${missingFields}`);
      return;
    }

    const cat = (recordToSave.category || "").toString().toLowerCase().trim();
    const handler = (recordToSave.handlerId || "")
      .toString()
      .toLowerCase()
      .trim();

    // Non-consultation → block if owned by other seller
    if (cat !== "consultation") {
      if (handler && handler !== sellerEmail) {
        toast.error("You can only edit your own records.");
        return;
      }
    }

    try {
      const payload = { _id: recordToSave._id };
      Object.keys(editedRecord).forEach((k) => {
        if (k === "handlerId") return; // never send handlerId
        if (k === "_id") return; // don't send duplicate id
        payload[k] = editedRecord[k];
      });

      // Normalize category if present
      if (payload.category) {
        payload.category = String(payload.category).toLowerCase().trim();
      }
      await updateSellerRecord(payload);

      toast.success("Record updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update record.");
    }

    setEditingId(null);
    setEditedRecord({});
  };

  const fetchRecordHistory = async (recordId) => {
    if (recordHistory[recordId]) {
      return;
    }

    setLoadingHistory((prev) => ({ ...prev, [recordId]: true }));
    try {
      const history = await getRecordHistory(recordId);
      setRecordHistory((prev) => ({ ...prev, [recordId]: history }));
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to fetch record history");
    } finally {
      setLoadingHistory((prev) => ({ ...prev, [recordId]: false }));
    }
  };

  const toggleHistoryExpand = async (recordId) => {
    if (expandedHistoryId === recordId) {
      setExpandedHistoryId(null);
    } else {
      await fetchRecordHistory(recordId);
      setExpandedHistoryId(recordId);
    }
  };

  const getUniqueValues = (key) => {
    if (!visibleRecords?.length) return [];
    const set = new Set();
    visibleRecords.forEach((r) => {
      let v = r[key];
      if (v === null || v === undefined || v === "") return;
      if (key === "category" || key === "service") {
        v = String(v).toLowerCase().trim();
      }
      set.add(v);
    });
    return Array.from(set);
  };

  const startRecord = (currentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(
    currentPage * itemsPerPage,
    filteredRecords.length
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg mb-8 p-6 border border-orange-100 space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
        <h2 className="text-2xl font-bold text-orange-800 flex items-center gap-2">
          <Table2 className="w-6 h-6" />
          My Sales Records
          <span className="text-sm font-normal text-orange-600">
            ({filteredRecords.length} of {visibleRecords.length} records)
          </span>
        </h2>
        <div className="self-start sm:self-auto">
          <Excel onExport={handleExport} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-orange-400" />
          <input
            type="text"
            placeholder="Search across all records..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 pr-3 py-2 border border-orange-300 rounded-md text-sm w-full"
          />
          {query && (
            <XCircle
              className="absolute right-2 top-2.5 w-4 h-4 text-orange-300 cursor-pointer"
              onClick={() => setQuery("")}
            />
          )}
        </div>

        <div className="relative">
          <Filter className="absolute left-2 top-2.5 w-4 h-4 text-orange-400" />
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
            className="pl-8 pr-3 py-2 border border-orange-300 rounded-md text-sm w-full"
          >
            <option value="">{headerLabels.status}</option>
            {getUniqueValues("status").map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <ClipboardEdit className="absolute left-2 top-2.5 w-4 h-4 text-orange-400" />
          <select
            value={filters.service}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, service: e.target.value }))
            }
            className="pl-8 pr-3 py-2 border border-orange-300 rounded-md text-sm w-full"
          >
            <option value="">{headerLabels.service}</option>
            {getUniqueValues("service").map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Globe className="absolute left-2 top-2.5 w-4 h-4 text-orange-400" />
          <select
            value={filters.country}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, country: e.target.value }))
            }
            className="pl-8 pr-3 py-2 border border-orange-300 rounded-md text-sm w-full"
          >
            <option value="">{headerLabels.country}</option>
            {getUniqueValues("country").map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <UserCheck className="absolute left-2 top-2.5 w-4 h-4 text-orange-400" />
          <select
            value={filters.expert}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, expert: e.target.value }))
            }
            className="pl-8 pr-3 py-2 border border-orange-300 rounded-md text-sm w-full"
          >
            <option value="">{headerLabels.expert}</option>
            {getUniqueValues("expert").map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Send className="absolute left-2 top-2.5 w-4 h-4 text-orange-400" />
          <select
            value={filters.mode}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, mode: e.target.value }))
            }
            className="pl-8 pr-3 py-2 border border-orange-300 rounded-md text-sm w-full"
          >
            <option value="">{headerLabels.mode}</option>
            {getUniqueValues("mode").map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => {
            setQuery("");
            setFilters({
              status: "",
              service: "",
              country: "",
              expert: "",
              mode: "",
            });
          }}
          className="text-sm text-orange-600 hover:underline"
        >
          Clear All Filters
        </button>
      </div>

      <div className="relative">
        <div className="overflow-auto max-h-[600px] min-h-[300px] border border-orange-300 rounded-lg">
          <table className="min-w-full divide-y divide-orange-200 text-sm">
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
            <tbody>
              {paginatedRecords.length ? (
                paginatedRecords.map((record) => {
                  const isEditing = editingId === record._id;
                  const isHistoryExpanded = expandedHistoryId === record._id;
                  const cat = (record.category || "")
                    .toString()
                    .toLowerCase()
                    .trim();
                  const handler = (record.handlerId || "")
                    .toString()
                    .toLowerCase()
                    .trim();
                  const isBlocked =
                    !sellerEmail ||
                    (cat !== "consultation" &&
                      handler &&
                      handler !== sellerEmail);

                  return (
                    <React.Fragment key={record._id}>
                      <tr
                        className="hover:bg-orange-50 border-b text-center cursor-pointer"
                        onClick={() => toggleHistoryExpand(record._id)}
                      >
                        <td className="px-3 py-2 border">
                          <button
                            onClick={() => toggleHistoryExpand(record._id)}
                            className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                            title="View change history"
                          >
                            {isHistoryExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        {headers.map((key, CellIndex) => {
                          const hasError = isEditing && validationErrors[key];
                          return (
                            <td
                              key={`${record._id}-${key}-${CellIndex}`}
                              className={`px-3 py-2 border whitespace-nowrap ${
                                hasError ? "bg-red-50" : ""
                              }`}
                            >
                              {isEditing && !nonEditableFields.includes(key) ? (
                                <div className="flex flex-col">
                                  {key === "status" ? (
                                    <select
                                      value={
                                        editedRecord[key] !== undefined
                                          ? editedRecord[key]
                                          : record[key] ?? ""
                                      }
                                      onChange={(e) =>
                                        handleChange(key, e.target.value)
                                      }
                                      className={`border rounded p-1 w-full text-xs ${
                                        hasError
                                          ? "border-red-500 bg-red-50"
                                          : "border-orange-300"
                                      }`}
                                    >
                                      <option value="">Select Status</option>
                                      {statusOptions.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  ) : key === "category" ? (
                                    <select
                                      value={
                                        editedRecord[key] !== undefined
                                          ? editedRecord[key]
                                          : record[key] ?? ""
                                      }
                                      onChange={(e) =>
                                        handleChange(key, e.target.value)
                                      }
                                      className={`border rounded p-1 w-full text-xs ${
                                        hasError
                                          ? "border-red-500 bg-red-50"
                                          : "border-orange-300"
                                      }`}
                                    >
                                      <option value="">Select Category</option>
                                      {categoryOptions.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  ) : key === "service" ? (
                                    <select
                                      value={
                                        editedRecord[key] !== undefined
                                          ? editedRecord[key]
                                          : record[key] ?? ""
                                      }
                                      onChange={(e) =>
                                        handleChange(key, e.target.value)
                                      }
                                      className={`border rounded p-1 w-full text-xs ${
                                        hasError
                                          ? "border-red-500 bg-red-50"
                                          : "border-orange-300"
                                      }`}
                                    >
                                      <option value="">Select Service</option>
                                      {serviceOptions.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  ) : key === "mode" ? (
                                    <select
                                      value={
                                        editedRecord[key] !== undefined
                                          ? editedRecord[key]
                                          : record[key] ?? ""
                                      }
                                      onChange={(e) =>
                                        handleChange(key, e.target.value)
                                      }
                                      className={`border rounded p-1 w-full text-xs ${
                                        hasError
                                          ? "border-red-500 bg-red-50"
                                          : "border-orange-300"
                                      }`}
                                    >
                                      <option value="">Select Mode</option>
                                      {modeOptions.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  ) : key === "country" ? (
                                    <select
                                      value={
                                        editedRecord[key] !== undefined
                                          ? editedRecord[key]
                                          : record[key] ?? ""
                                      }
                                      onChange={(e) =>
                                        handleChange(key, e.target.value)
                                      }
                                      className={`border rounded p-1 w-full text-xs ${
                                        hasError
                                          ? "border-red-500 bg-red-50"
                                          : "border-orange-300"
                                      }`}
                                    >
                                      <option value="">Select Country</option>
                                      {countryOptions.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  ) : key === "state" ? (
                                    <select
                                      value={
                                        editedRecord[key] !== undefined
                                          ? editedRecord[key]
                                          : record[key] ?? ""
                                      }
                                      onChange={(e) =>
                                        handleChange(key, e.target.value)
                                      }
                                      className={`border rounded p-1 w-full text-xs ${
                                        hasError
                                          ? "border-red-500 bg-red-50"
                                          : "border-orange-300"
                                      }`}
                                    >
                                      <option value="">Select State</option>
                                      {stateOptions.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      value={
                                        editedRecord[key] !== undefined
                                          ? editedRecord[key]
                                          : record[key] ?? ""
                                      }
                                      onChange={(e) =>
                                        handleChange(key, e.target.value)
                                      }
                                      className={`border rounded p-1 w-full text-xs ${
                                        hasError
                                          ? "border-red-500 bg-red-50"
                                          : "border-orange-300"
                                      }`}
                                    />
                                  )}
                                </div>
                              ) : (
                                formatValue(key, record[key])
                              )}
                            </td>
                          );
                        })}

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
                              className={`text-blue-600 hover:underline text-xs ${
                                isBlocked ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              disabled={isBlocked}
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>

                      {isHistoryExpanded && (
                        <tr className="bg-blue-50 border-b">
                          <td colSpan={headers.length + 2} className="p-4">
                            {loadingHistory[record._id] ? (
                              <div className="flex items-center gap-2 text-sm text-blue-600">
                                <div className="animate-spin">⏳</div>
                                Loading history...
                              </div>
                            ) : recordHistory[record._id]?.length > 0 ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 font-semibold text-blue-700 mb-3">
                                  <History className="w-4 h-4" />
                                  Change History
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full text-xs bg-white rounded border border-blue-200">
                                    <thead className="bg-blue-100">
                                      <tr>
                                        <th className="px-3 py-2 text-left border">
                                          Field
                                        </th>
                                        <th className="px-3 py-2 text-left border">
                                          Old Value
                                        </th>
                                        <th className="px-3 py-2 text-left border">
                                          New Value
                                        </th>
                                        <th className="px-3 py-2 text-left border">
                                          Changed By
                                        </th>
                                        <th className="px-3 py-2 text-left border">
                                          Date & Time
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {recordHistory[record._id]?.map(
                                        (entry, idx) => (
                                          <tr
                                            key={`${record._id}-${entry.field}-${entry.changedAt}-${idx}`}
                                            className="border-b hover:bg-blue-50"
                                          >
                                            <td className="px-3 py-2 border font-medium text-blue-700">
                                              {entry.fieldLabel || entry.field}
                                            </td>
                                            <td className="px-3 py-2 border text-red-600">
                                              {entry.oldValue || "-"}
                                            </td>
                                            <td className="px-3 py-2 border text-green-600">
                                              {entry.newValue || "-"}
                                            </td>
                                            <td className="px-3 py-2 border">
                                              {entry.changedByName ||
                                                entry.changedBy}
                                            </td>
                                            <td className="px-3 py-2 border text-gray-600">
                                              {new Date(
                                                entry.changedAt
                                              ).toLocaleString()}
                                            </td>
                                          </tr>
                                        )
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <AlertCircle className="w-4 h-4" />
                                No changes recorded for this record yet.
                              </div>
                            )}
                          </td>
                        </tr>
                      )}

                      {/* UPDATED: Show validation errors below row */}
                      {isEditing &&
                        Object.keys(validationErrors).length > 0 && (
                          <tr className="bg-red-50 border-b">
                            <td colSpan={headers.length + 2} className="p-4">
                              <div className="flex items-start gap-2 text-sm text-red-700">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="font-semibold mb-2">
                                    Please fill required fields:
                                  </p>
                                  <ul className="list-disc list-inside space-y-1">
                                    {Object.entries(validationErrors).map(
                                      ([field, error]) => (
                                        <li key={field}>{error}</li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={headers.length + 2}
                    className="text-center text-gray-500 py-6 p-4"
                  >
                    No records found from {visibleRecords.length} total records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="sticky bottom-0 bg-white flex justify-center items-center gap-4 py-2 border-t border-orange-300 z-10">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-orange-300 text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages} &nbsp;
            <span className="text-xs text-orange-700">
              (showing {startRecord}–{endRecord} of {filteredRecords.length}{" "}
              filtered)
            </span>
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-orange-500 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerRecordList;
