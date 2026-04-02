import React, { useContext, useState, useMemo } from "react";
import { SellerContext } from "../../context/SellerContext";
import Excel from "../../components/shared/Excel";
import { toast } from "react-toastify";
import { Table2 } from "lucide-react";
import {
  expectedHeaders,
  headerLabels,
  nonEditableFields,
  hiddenFields,
  categoryOptionsConfig,
} from "../../utils/utils.js";
import Filters from "../../components/shared/Filters.jsx";
import OptionsContext from "../../context/OptionsContext.jsx";
import SellerPagination from "../../components/seller/SellerPagination.jsx";
import SellerTable from "../../components/seller/SellerTable.jsx";
import { formatValue, formatDate } from "../../utils/formatter.js";
import { gemFieldOrder, hasGemSelection } from "../../utils/gemsHierarchyUtils.js";

const SellerRecordList = () => {
  const {
    dropdowns,
    requiredFields,
    loading: optionsLoading,
    error: optionsError,
    getStatesByCountry,
  } = useContext(OptionsContext);
  const {
    sellerRecords,
    updateSellerRecord,
    getRecordHistory,
    fetchAllRecordsForExport,
    totalPages,
    page,
    totalRecords,
    goToPage,
  } = useContext(SellerContext);
  const [editingId, setEditingId] = useState(null); // use id instead of index
  const [editedRecord, setEditedRecord] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [recordHistory, setRecordHistory] = useState({});
  const [loadingHistory, setLoadingHistory] = useState({});
  const itemsPerPage = 100;

  const currentSeller = JSON.parse(localStorage.getItem("currentSeller"));
  const sellerEmail = currentSeller?.email?.toLowerCase().trim();
  const getCategoryTokens = (value) => {
    const flatten = (input) => {
      if (Array.isArray(input)) {
        return input.flatMap((item) => flatten(item));
      }

      if (input && typeof input === "object") {
        return [input.name || input.label || input.value || ""];
      }

      return [input ?? ""];
    };

    return flatten(value)
      .flatMap((item) => item.toString().split(","))
      .map((item) => item.toLowerCase().trim())
      .filter(Boolean);
  };

  const visibleRecords = useMemo(() => {
    return Array.isArray(sellerRecords) ? sellerRecords : [];
  }, [sellerRecords]);

  const dynamicHeaders = useMemo(() => {
    return visibleRecords.reduce(
      (set, record) => {
        Object.keys(record).forEach((key) => set.add(key));
        return set;
      },
      new Set(Object.keys(expectedHeaders)),
    );
  }, [visibleRecords]);

  const headers = useMemo(() => {
    return Array.from(dynamicHeaders).filter(
      (key) =>
        key &&
        key.trim() !== "" &&
        key !== "serialno" &&
        key !== "_id" &&
        !hiddenFields.includes(key),
    );
  }, [dynamicHeaders]);

  const validateRecord = (record) => {
    const errors = {};

    requiredFields.forEach((field) => {
      const value = record[field];
      const isEmptyArray =
        Array.isArray(value) &&
        value.every((item) => {
          if (item === null || item === undefined) return true;
          return String(item).trim() === "";
        });

      if (
        (!Array.isArray(value) && !value) ||
        (typeof value === "string" && value.trim() === "") ||
        isEmptyArray ||
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

  const handleExport = async () => {
    const exportData = await fetchAllRecordsForExport();
    if (!exportData || exportData.length === 0) {
      toast.warning("No records available to export");
      return [];
    }

    toast.success(`Exporting ${exportData.length} records`);
    return exportData;
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    // Create safe record copy FIRST
    const safeRecord = Object.fromEntries(
      Object.entries(record).map(([k, v]) => [k, v ?? ""]),
    );
    setEditedRecord(safeRecord);
    setValidationErrors({});
  };

  const handleChange = (key, value) => {
    if (gemFieldOrder.includes(key)) {
      const keyIndex = gemFieldOrder.indexOf(key);
      const candidate = { ...editedRecord, [key]: value };
      const hasAllParents = gemFieldOrder
        .slice(0, keyIndex)
        .every((fieldName) => hasGemSelection(candidate[fieldName]));

      if (keyIndex > 0 && value && !hasAllParents) {
        toast.info("Select parent gem fields first");
        return;
      }
    }

    setEditedRecord((prev) => {
      const next = { ...prev, [key]: value };
      if (!gemFieldOrder.includes(key)) return next;

      const changedIndex = gemFieldOrder.indexOf(key);
      for (let i = changedIndex + 1; i < gemFieldOrder.length; i += 1) {
        next[gemFieldOrder[i]] = "";
      }
      return next;
    });

    if (requiredFields.includes(key)) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        const isEmptyArray =
          Array.isArray(value) &&
          value.every((item) => {
            if (item === null || item === undefined) return true;
            return String(item).trim() === "";
          });

        if (
          (!Array.isArray(value) && !value) ||
          (typeof value === "string" && value.trim() === "") ||
          isEmptyArray
        ) {
          newErrors[key] = `${headerLabels[key] || key} is required.`;
        } else {
          delete newErrors[key];
        }
        return newErrors;
      });
    }
  };

  const handleSave = async (recordId) => {
    const recordToSave = sellerRecords.find((r) => r._id === recordId);
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

    const categoryTokens = getCategoryTokens(recordToSave.category);
    const isConsultation = categoryTokens.includes("consultation");
    const handler = (recordToSave.handlerId || "")
      .toString()
      .toLowerCase()
      .trim();

    if (!isConsultation) {
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
      await updateSellerRecord(payload);

      toast.success("Record updated successfully!");
    } catch (error) {
      const errorMsg =
        error?.message || "Failed to update record. Please try again.";
      toast.error(errorMsg);
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
      const errorMsg =
        error?.message || "Could not fetch record history. Please try again.";
      toast.error(errorMsg);
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

  const startRecord = (page - 1) * itemsPerPage + 1;
  const endRecord = Math.min(page * itemsPerPage, totalRecords);

  if (optionsLoading) {
    return <div className="p-6">Loading configuration...</div>;
  }

  if (optionsError) {
    return <div className="p-6 text-red-500">{optionsError}</div>;
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <div className="isolate overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-white via-orange-50/40 to-amber-50/40 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight text-orange-900">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-orange-200 bg-white text-orange-600 shadow-sm">
                  <Table2 className="h-5 w-5" />
                </span>
                My Sales Records
              </h2>
              <p className="inline-flex items-center rounded-full border border-orange-200 bg-white px-3 py-1 text-sm font-medium text-orange-700">
                Showing {startRecord} to {endRecord} of {totalRecords} records
              </p>
            </div>
            <div className="self-start sm:self-auto">
              <Excel onExport={handleExport} />
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <Filters
            context={SellerContext}
            categoryOptionsConfig={categoryOptionsConfig}
            showSearch={false}
            showAdvancedToggle={true}
          />

          <div className="relative">
            <SellerTable
              headers={headers}
              headerLabels={headerLabels}
              requiredFields={requiredFields}
              paginatedRecords={sellerRecords}
              visibleRecords={sellerRecords}
              editingId={editingId}
              editedRecord={editedRecord}
              validationErrors={validationErrors}
              nonEditableFields={nonEditableFields}
              dropdowns={dropdowns}
              getStatesByCountry={getStatesByCountry}
              sellerEmail={sellerEmail}
              expandedHistoryId={expandedHistoryId}
              recordHistory={recordHistory}
              loadingHistory={loadingHistory}
              toggleHistoryExpand={toggleHistoryExpand}
              handleEdit={handleEdit}
              handleChange={handleChange}
              handleSave={handleSave}
              isSaveDisabled={isSaveDisabled}
              formatValue={formatValue}
              formatDate={formatDate}
            />
            <SellerPagination
              currentPage={page}
              totalPages={totalPages}
              startRecord={startRecord}
              endRecord={endRecord}
              filteredRecordsLength={totalRecords}
              goToPage={goToPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerRecordList;
