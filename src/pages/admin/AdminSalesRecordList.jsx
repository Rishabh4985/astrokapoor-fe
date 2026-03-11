import React, { useState, useEffect, useContext, useMemo } from "react";
import { AdminContext } from "../../context/AdminContext";
import Excel from "../../components/shared/Excel";
import { toast } from "react-toastify";
import { Table2, Edit2, Trash2, X, Check, Lock } from "lucide-react";
import {
  headerLabels,
  expectedHeaders,
  hiddenFields,
  nonEditableFields,
  categoryOptionsConfig,
} from "../../utils/utils.js";
import { Country, State } from "country-state-city";
import Filters from "../../components/shared/Filters";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import AdminTable from "../../components/admin/AdminTable.jsx";
import OptionsContext from "../../context/OptionsContext";
import { formatValue, capitalizeValue } from "../../utils/formatter.js";

const AdminSalesRecordList = () => {
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
    records,
    page,
    totalPages,
    totalRecords,
    goToPage,
    updateRecord,
    deleteRecord,
    error,
    clearError,
    importRecords,
  } = useContext(AdminContext);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

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

    if (dropdowns?.[fieldName]) {
      return dropdowns[fieldName].map((item) =>
        typeof item === "string"
          ? { label: item, value: item }
          : { label: item.label, value: item.value },
      );
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

  const flattenedRecords = useMemo(() => {
    if (!records || records.length === 0) return [];

    if (records.length > 0 && !records[0]?.records) {
      return records;
    }

    return records.flatMap((user) => {
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
  }, [records]);

  const dynamicHeaders = useMemo(() => {
    const set = new Set(Object.keys(expectedHeaders));

    flattenedRecords.forEach((record) => {
      Object.keys(record).forEach((key) => set.add(key));
    });

    return Array.from(set);
  }, [flattenedRecords]);

  const headers = dynamicHeaders.filter(
    (key) =>
      key &&
      key.trim() !== "" &&
      key !== "serialno" &&
      key !== "_id" &&
      !hiddenFields.includes(key),
  );

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
      "Are you sure you want to delete this record? This action cannot be undone.",
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

  const handleImport = async (importedData) => {
    try {
      await importRecords(importedData);
      toast.success("Records imported and saved to database!");
    } catch (err) {
      toast.error("Import failed", err);
    }
  };

  const handleExport = () => {
    if (!records || records.length === 0) {
      toast.warning("No records available to export");
      return null;
    }

    toast.success(`Exporting ${records.length} records`);
    return records;
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  if (optionsLoading) {
    return <div className="p-6">Loading configuration...</div>;
  }

  if (optionsError) {
    return <div className="p-6 text-red-500">{optionsError}</div>;
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg mb-8 border border-orange-100">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-orange-800 flex items-center gap-2">
          <Table2 className="w-6 h-6" /> Sales Records
          <span className="text-sm font-normal text-orange-600">
            ({records.length} of {totalRecords} records)
          </span>
        </h2>
        <Excel
          onImport={handleImport}
          onExport={records.length ? handleExport : null}
        />
      </div>

      {/* FILTERS */}
      <div className="bg-white/70 border border-orange-200 backdrop-blur-sm rounded-xl p-3 mb-6 shadow-md relative z-10">
        <Filters
          context={AdminContext}
          categoryOptionsConfig={categoryOptionsConfig}
          showSearch={true}
          showAdvancedToggle={true}
        />
      </div>

      {/* TABLE */}
      <AdminTable
        headers={headers}
        records={records}
        editingId={editingId}
        draft={draft}
        fieldErrors={fieldErrors}
        isSaving={isSaving}
        isDeleting={isDeleting}
        requiredFields={requiredFields}
        isFieldEditable={isFieldEditable}
        getFieldLabel={getFieldLabel}
        getDropdownOptionsForField={getDropdownOptionsForField}
        formatValue={formatValue}
        startEdit={startEdit}
        cancelEdit={cancelEdit}
        saveEdit={saveEdit}
        handleEditChange={handleEditChange}
        renderActions={(record, isEditing) => {
          if (isEditing) {
            return (
              <div className="flex justify-center gap-2">
                <button
                  onClick={saveEdit}
                  disabled={isSaving || Object.keys(fieldErrors).length > 0}
                  className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 transition"
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
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          }

          return (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => startEdit(record)}
                className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(record._id)}
                disabled={isDeleting === record._id}
                className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition"
              >
                {isDeleting === record._id ? (
                  <span className="w-4 h-4 inline-block border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          );
        }}
      />

      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalRecords}
        itemsPerPage={100}
        onPrev={() => goToPage(page - 1)}
        onNext={() => goToPage(page + 1)}
      />

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
