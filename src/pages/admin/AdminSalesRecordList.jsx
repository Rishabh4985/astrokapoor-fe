import React, { useState, useEffect, useContext, useMemo } from "react";
import { AdminContext } from "../../context/AdminContext";
import Excel from "../../components/shared/Excel";
import { toast } from "react-toastify";
import { Table2, Edit2, Trash2, X, Check, Lock, Eye, EyeOff } from "lucide-react";
import {
  headerLabels,
  expectedHeaders,
  hiddenFields,
  nonEditableFields,
  categoryOptionsConfig,
  gemFieldOrder,
} from "../../utils/utils.js";
import Filters from "../../components/shared/Filters";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import AdminTable from "../../components/admin/AdminTable.jsx";
import OptionsContext from "../../context/OptionsContext";
import { formatValue } from "../../utils/formatter.js";

const AdminSalesRecordList = () => {
  const {
    dropdowns,
    requiredFields,
    loading: optionsLoading,
    error: optionsError,
    getStatesByCountry,
  } = useContext(OptionsContext);
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
    fetchAllRecordsForExport,
  } = useContext(AdminContext);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showActionsColumn, setShowActionsColumn] = useState(true);

  const getDropdownOptionsForField = (fieldName) => {
    if (gemFieldOrder.includes(fieldName)) {
      return (dropdowns[fieldName] || []).map((item) => ({
        label: item,
        value: item,
      }));
    }

    if (fieldName === "country") {
      return (
        dropdowns.country?.map((item) => ({
          label: item.name,
          value: item.name,
        })) || []
      );
    }

    if (fieldName === "state") {
      // Use draft for edited values, fall back to original record
      const countryValue =
        draft.country ||
        flattenedRecords.find((r) => r._id === editingId)?.country;
      if (!countryValue) return [];

      const countryObj = dropdowns.country?.find(
        (c) => c.name.toLowerCase() === countryValue.toLowerCase(),
      );
      if (!countryObj) return [];

      const states = getStatesByCountry(countryObj.isoCode);
      return states.map((item) => ({
        label: item,
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
      const isMissing =
        (Array.isArray(value) &&
          value.every((item) => {
            if (item === null || item === undefined) return true;
            return String(item).trim() === "";
          })) ||
        (!Array.isArray(value) &&
          (!value || (typeof value === "string" && value.trim() === "")));

      if (isMissing) {
        return {
          isValid: false,
          errorMessage: `${getFieldLabel(fieldName)} is required`,
        };
      }
    }

    // Validate customerName contains only alphabets, spaces, dots, /, (), and '
    if (fieldName === "customerName" && value) {
      const nameRegex = /^[a-zA-Z./()'\s]{2,}$/;
      if (!nameRegex.test(value)) {
        return {
          isValid: false,
          errorMessage:
            "Customer name can only contain alphabets, spaces, dots, /, (, ), and '",
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
      const didUpdate = await updateRecord(editingId, partial);
      if (!didUpdate) return;
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
      const didDelete = await deleteRecord(id);
      if (!didDelete) return;
      toast.success("Record deleted successfully!");
    } catch (err) {
      toast.error(err || "Failed to delete record");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleImport = async () => {
    try {
      await importRecords();
    } catch (err) {
      toast.error("Import failed", err);
    }
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

  const startIndex = (page - 1) * 100 + 1;
  const endIndex = Math.min(page * 100, totalRecords);

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
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <div className="isolate rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-white via-orange-50/40 to-amber-50/40 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight text-orange-900">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-orange-200 bg-white text-orange-600 shadow-sm">
                  <Table2 className="h-5 w-5" />
                </span>
                Sales Records
              </h2>
              <p className="inline-flex items-center rounded-full border border-orange-200 bg-white px-3 py-1 text-sm font-medium text-orange-700">
                Showing {startIndex} to {endIndex} of {totalRecords} records
              </p>
            </div>
            <Excel onImport={handleImport} onExport={handleExport} />
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <Filters
            context={AdminContext}
            categoryOptionsConfig={categoryOptionsConfig}
            showSearch={false}
            showAdvancedToggle={true}
          />

          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setShowActionsColumn((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
            >
              {showActionsColumn ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  Hide Actions
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Show Actions
                </>
              )}
            </button>
          </div>

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
            isDropdownField={(field) =>
              gemFieldOrder.includes(field) ||
              field === "country" ||
              field === "state" ||
              Array.isArray(dropdowns?.[field])
            }
            formatValue={formatValue}
            startEdit={startEdit}
            cancelEdit={cancelEdit}
            saveEdit={saveEdit}
            handleEditChange={handleEditChange}
            showActions={showActionsColumn}
            renderActions={(record, isEditing) => {
              if (isEditing) {
                return (
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={isSaving || Object.keys(fieldErrors).length > 0}
                      className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 p-1.5 text-white shadow-sm transition hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={isSaving}
                      className="rounded-lg bg-slate-500 p-1.5 text-white shadow-sm transition hover:bg-slate-600 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              }

              return (
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => startEdit(record)}
                    className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 p-1.5 text-white shadow-sm transition hover:from-orange-600 hover:to-amber-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(record._id)}
                    disabled={isDeleting === record._id}
                    className="rounded-lg bg-red-500 p-1.5 text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
                  >
                    {isDeleting === record._id ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
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

          <div className="flex flex-wrap gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1">
              <span className="font-bold text-red-500">*</span>
              <span>Required Field</span>
            </div>
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3 text-slate-400" />
              <span>Non-Editable Field</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSalesRecordList;
