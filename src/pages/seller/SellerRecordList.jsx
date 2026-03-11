import React, { useContext, useState, useMemo } from "react";
import { SellerContext } from "../../context/SellerContext";
import Excel from "../../components/shared/Excel";
import { toast } from "react-toastify";
import { Table2, AlertCircle, ChevronUp, ChevronDown } from "lucide-react";
import { Country, State } from "country-state-city";
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

const SellerRecordList = () => {
  const {
    dropdowns,
    requiredFields,
    loading: optionsLoading,
    error: optionsError,
  } = useContext(OptionsContext);
  const countryOptions = useMemo(
    () => Country.getAllCountries().map((c) => c.name),
    [],
  );
  const stateOptions = useMemo(
    () => State.getAllStates().map((s) => s.name),
    [],
  );
  const {
    sellerRecords,
    updateSellerRecord,
    getRecordHistory,
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

  const handleExport = () => {
    toast.success(`Exporting ${totalRecords} filtered records`);
    return sellerRecords;
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    // Create safe record copy FIRST
    const safeRecord = Object.fromEntries(
      Object.entries(record).map(([k, v]) => [k, v ?? ""]),
    );
    setEditedRecord({
      ...safeRecord,
      category: record.category
        ? String(record.category).toLowerCase().trim()
        : "",
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

    const cat = (recordToSave.category || "").toString().toLowerCase().trim();
    const handler = (recordToSave.handlerId || "")
      .toString()
      .toLowerCase()
      .trim();

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

  const startRecord = (page - 1) * itemsPerPage + 1;
  const endRecord = Math.min(page * itemsPerPage, totalRecords);

  if (optionsLoading) {
    return <div className="p-6">Loading configuration...</div>;
  }

  if (optionsError) {
    return <div className="p-6 text-red-500">{optionsError}</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg mb-8 p-6 border border-orange-100 space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
        <h2 className="text-2xl font-bold text-orange-800 flex items-center gap-2">
          <Table2 className="w-6 h-6" />
          My Sales Records
          <p className="text-sm text-orange-600">
            (showing {startRecord}–{endRecord} of {totalRecords} records)
          </p>
        </h2>
        <div className="self-start sm:self-auto">
          <Excel onExport={handleExport} />
        </div>
      </div>

      <Filters
        context={SellerContext}
        categoryOptionsConfig={categoryOptionsConfig}
        showSearch={true}
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
          countryOptions={countryOptions}
          stateOptions={stateOptions}
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
  );
};

export default SellerRecordList;
