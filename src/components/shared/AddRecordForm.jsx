import React, { useState, useContext, useEffect, useRef } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import OptionsContext from "../../context/OptionsContext";
import { toast } from "react-toastify";
import MobileFields from "./MobileFields";
import ExistingUserSearch from "./ExistingUserSearch";
import DateField from "./DateField";
import { expectedHeaders, headerLabels } from "../../utils/utils";
import {
  validateEmail,
  validateName,
  validatePhone,
  stripCountryCode,
  detectPhoneIso,
  buildFullPhone,
} from "../../utils/formUtils";
import {
  gemFieldOrder,
  getGemOptionsForField,
  clearChildGemFields,
  hasGemSelection,
} from "../../utils/gemsHierarchyUtils";

const LabelWithAsterisk = ({ text }) => (
  <label className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
    {text} <span className="text-red-500">*</span>
  </label>
);

// ============ MAIN COMPONENT ============

const AddRecordForm = ({ onAdd }) => {
  const { authToken, userRole } = useAuth();
  const seller = JSON.parse(localStorage.getItem("currentSeller"));
  const isSeller = !!seller?.email;

  const [formData, setFormData] = useState({
    ...expectedHeaders,
    gems1: [],
    gems2: [],
    gems3: [],
    gems4: [],
    handlerId: isSeller ? seller.email : "",
    countryIso: "",
    mobile1CountryIso: "",
    mobile2CountryIso: "",
  });

  const [mode, setMode] = useState("new");
  const [searchEmail, setSearchEmail] = useState("");
  const [existingRecords, setExistingRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [openMultiDropdowns, setOpenMultiDropdowns] = useState({});
  const [dropdownDirection, setDropdownDirection] = useState({});
  const [optionSearch, setOptionSearch] = useState({});
  const multiSelectRefs = useRef({});
  const { dropdowns, requiredFields, loading, getStatesByCountry } =
    useContext(OptionsContext);
  const multiSelectFields = [
    "service",
    "category",
    "handleBy",
    ...gemFieldOrder,
  ];

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest('[data-multi-select="true"]')
      ) {
        setOpenMultiDropdowns({});
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenMultiDropdowns({});
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const getDropdownOpenDirection = (fieldKey) => {
    const node = multiSelectRefs.current[fieldKey];
    if (!node) return "down";

    const rect = node.getBoundingClientRect();
    const estimatedPanelHeight = 260;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < estimatedPanelHeight && spaceAbove > spaceBelow) {
      return "up";
    }

    return "down";
  };

  // ============ HANDLER FUNCTIONS ============

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle multi-select fields
    if (multiSelectFields.includes(name)) {
      setFormData((prev) => {
        const currentValues = Array.isArray(prev[name])
          ? prev[name]
          : prev[name]
            ? [prev[name]]
            : [];
        const updatedValues = currentValues.includes(value)
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value];
        const next = { ...prev, [name]: updatedValues };
        if (gemFieldOrder.includes(name)) {
          return clearChildGemFields(name, next);
        }
        return next;
      });
      return;
    }

    // Validate customer name to only accept alphabets and spaces
    if (name === "customerName") {
      const nameRegex = /^[a-zA-Z\s]*$/;
      if (!nameRegex.test(value)) {
        return;
      }
    }

    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (gemFieldOrder.includes(name)) {
        return clearChildGemFields(name, next);
      }
      return next;
    });
  };

  // Helper function to remove a selected item from any field
  const removeItem = (field, itemToRemove) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        [field]: Array.isArray(prev[field])
          ? prev[field].filter((item) => item !== itemToRemove)
          : [],
      };

      if (gemFieldOrder.includes(field)) {
        return clearChildGemFields(field, next);
      }

      return next;
    });
  };

  // Address country change (does NOT affect phone countries)
  const handleCountryChange = (e) => {
    const countryName = e.target.value; // "India" (keep original case)
    const countryObj = dropdowns.country?.find((c) => c.name === countryName);
    const isoCode = countryObj?.isoCode || "";

    if (!countryObj) {
      toast.error("Invalid country selection");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      country: countryName, // ✅ Keep original case "India"
      countryIso: isoCode,
      state: "",
    }));

    setSelectedCountry(isoCode);
  };

  const handlePhoneCountryChange = (e, phoneNumber) => {
    const countryName = e.target.value;
    const countryObj = dropdowns.country?.find((c) => c.name === countryName);
    const isoCode = countryObj?.isoCode || "";

    setFormData((prev) => ({
      ...prev,
      [`${phoneNumber}CountryIso`]: isoCode,
    }));
  };

  const validateForm = (formData) => {
    for (let field of requiredFields) {
      const value = formData[field];

      if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      ) {
        return `${headerLabels[field]} is required`;
      }
    }

    if (!validateName(formData.customerName)) return "Invalid customer name";

    if (formData.email1 && !validateEmail(formData.email1))
      return "Invalid primary email";

    if (formData.email2 && !validateEmail(formData.email2))
      return "Invalid secondary email";

    if (formData.mobile1 && formData.mobile1CountryIso) {
      if (!validatePhone(formData.mobile1CountryIso, formData.mobile1))
        return "Invalid mobile number";
    } else if (formData.mobile1 && !formData.mobile1CountryIso) {
      return "Select country for primary mobile";
    }

    if (formData.mobile2 && formData.mobile2CountryIso) {
      if (!validatePhone(formData.mobile2CountryIso, formData.mobile2))
        return "Invalid alternate mobile number";
    } else if (formData.mobile2 && !formData.mobile2CountryIso) {
      return "Select country for alternate mobile";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validateForm(formData);
    if (error) {
      toast.error(error);
      return;
    }
    const newRecord = {
      ...formData,
      transactionId: formData.transactionId?.trim(),
      customerName: formData.customerName?.trim(),
      address: formData.address?.trim(),
      mobile1: buildFullPhone(formData.mobile1CountryIso, formData.mobile1),
      mobile2: buildFullPhone(formData.mobile2CountryIso, formData.mobile2),
      dateOfPayment: formData.dateOfPayment
        ? new Date(formData.dateOfPayment)
        : new Date(),
      handlerId: isSeller ? seller.email : formData.handlerId || "admin",
    };

    setIsSubmitting(true);
    try {
      await onAdd(newRecord);

      toast.success("Record Added Successfully!");

      if (mode === "new") {
        const newUser = {
          email1: formData.email1?.toLowerCase() || "",
          email2: formData.email2?.toLowerCase() || "",
          mobile1: newRecord.mobile1 || "",
          mobile2: newRecord.mobile2 || "",
          customerName: formData.customerName,
          country: formData.country,
          state: formData.state || "",
          address: formData.address || "",
          handlerId: newRecord.handlerId,
        };

        const existingUsers =
          JSON.parse(sessionStorage.getItem("userList")) || [];
        const normalize = (v) => v?.toLowerCase() || "";

        const isDuplicate = existingUsers.some((user) => {
          const values = [
            normalize(user.email1),
            normalize(user.email2),
            user.mobile1,
            user.mobile2,
          ];
          return (
            values.includes(normalize(newUser.email1)) ||
            values.includes(normalize(newUser.email2)) ||
            values.includes(newUser.mobile1) ||
            values.includes(newUser.mobile2)
          );
        });

        if (!isDuplicate) {
          sessionStorage.setItem(
            "userList",
            JSON.stringify([...existingUsers, newUser]),
          );
        }
      }

      // Reset form
      setFormData({
        ...expectedHeaders,
        gems1: [],
        gems2: [],
        gems3: [],
        gems4: [],
        handlerId: isSeller ? seller.email : "",
        countryIso: "",
        mobile1CountryIso: "",
        mobile2CountryIso: "",
      });
      setMode("new");
      setSearchEmail("");
      setSelectedCountry("");
      setExistingRecords([]);
      setSelectedRecord(null);
      setOpenMultiDropdowns({});
      setOptionSearch({});
    } catch (error) {
      const errorMsg =
        error?.message || "Failed to add record. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSearch = async (rawKeyword = searchEmail) => {
    const keyword = rawKeyword?.trim() || "";

    if (!keyword) {
      toast.error("Please enter search keyword.");
      return;
    }

    setSearchEmail(keyword);

    const API_BASE = import.meta.env.VITE_API_URL;

    const baseUrl =
      userRole === "admin"
        ? `${API_BASE}/admin`
        : userRole === "seller"
          ? `${API_BASE}/seller`
          : `${API_BASE}`;

    const url = `${baseUrl}/users/search?keyword=${encodeURIComponent(keyword)}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });
      const user = await response.json();

      if (Array.isArray(user) && user.length > 0) {
        setExistingRecords(user);

        const selected = user[0];
        setSelectedRecord(selected);

        const userCountryObj = dropdowns.country?.find(
          (c) => c.name.toLowerCase() === selected.country?.toLowerCase(),
        );

        const mobile1CountryIso = detectPhoneIso(
          selected.mobile1,
          userCountryObj?.isoCode || "",
        );

        const mobile2CountryIso = detectPhoneIso(
          selected.mobile2,
          userCountryObj?.isoCode || "",
        );

        setFormData((prev) => ({
          ...prev,
          dateOfPayment: prev.dateOfPayment || "",
          customerName: selected.customerName || prev.customerName || "",
          email1: selected.email1 || "",
          email2: selected.email2 || "",
          mobile1: stripCountryCode(selected.mobile1),
          mobile2: stripCountryCode(selected.mobile2),
          country: selected.country || "",
          countryIso: userCountryObj?.isoCode || "",
          mobile1CountryIso: mobile1CountryIso,
          mobile2CountryIso: mobile2CountryIso,
          state: selected.state || "",
          address: selected.address || "",
          expert: selected.expert || "",
          handlerId: selected.handlerId || "",
          handleBy: Array.isArray(selected.handleBy) ? selected.handleBy : (selected.handleBy ? [selected.handleBy] : []),
          service: Array.isArray(selected.service) ? selected.service : (selected.service ? [selected.service] : []),
          status: selected.status || "",
          amount: selected.amount || "",
          pendingAmount: selected.pendingAmount || "",
          refund: selected.refund || "",
          category: Array.isArray(selected.category) ? selected.category : (selected.category ? [selected.category] : []),
          gems: Array.isArray(selected.gems) ? selected.gems : (selected.gems ? [selected.gems] : []),
          gems1: Array.isArray(selected.gems1) ? selected.gems1 : (selected.gems1 ? [selected.gems1] : []),
          gems2: Array.isArray(selected.gems2) ? selected.gems2 : (selected.gems2 ? [selected.gems2] : []),
          gems3: Array.isArray(selected.gems3) ? selected.gems3 : (selected.gems3 ? [selected.gems3] : []),
          gems4: Array.isArray(selected.gems4) ? selected.gems4 : (selected.gems4 ? [selected.gems4] : []),
        }));

        setSelectedCountry(userCountryObj?.isoCode || "");
        toast.success("User found and data imported.");
      } else {
        setExistingRecords([]);
        setSelectedRecord(null);
        toast.error("No user found with this input.");
      }
    } catch (error) {
      const errorMsg =
        error?.message || "Could not search for user. Please try again.";
      toast.error(errorMsg);
    }
  };

  const handleEditExistingUser = () => {
    if (!selectedRecord) return;
    const countryObj = dropdowns.country?.find(
      (c) => c.name.toLowerCase() === selectedRecord.country?.toLowerCase(),
    );
    setSelectedCountry(countryObj?.isoCode || "");

    setFormData((prev) => ({
      ...prev,
      customerName: selectedRecord.customerName || "",
      email1: selectedRecord.email1 || "",
      email2: selectedRecord.email2 || "",
      mobile1: stripCountryCode(selectedRecord.mobile1),
      mobile2: stripCountryCode(selectedRecord.mobile2),

      mobile1CountryIso: detectPhoneIso(
        selectedRecord.mobile1,
        countryObj?.isoCode || "",
      ),
      mobile2CountryIso: detectPhoneIso(
        selectedRecord.mobile2,
        countryObj?.isoCode || "",
      ),
      country: selectedRecord.country || "",
      countryIso: countryObj?.isoCode || "",
      state: selectedRecord.state || "",
      address: selectedRecord.address || "",
      expert: selectedRecord.expert || "",
      handlerId: selectedRecord.handlerId || "",
      handleBy: Array.isArray(selectedRecord.handleBy)
        ? selectedRecord.handleBy
        : selectedRecord.handleBy
          ? [selectedRecord.handleBy]
          : [],
      gems: Array.isArray(selectedRecord.gems)
        ? selectedRecord.gems
        : selectedRecord.gems
          ? [selectedRecord.gems]
          : [],
      gems1: Array.isArray(selectedRecord.gems1)
        ? selectedRecord.gems1
        : selectedRecord.gems1
          ? [selectedRecord.gems1]
          : [],
      gems2: Array.isArray(selectedRecord.gems2)
        ? selectedRecord.gems2
        : selectedRecord.gems2
          ? [selectedRecord.gems2]
          : [],
      gems3: Array.isArray(selectedRecord.gems3)
        ? selectedRecord.gems3
        : selectedRecord.gems3
          ? [selectedRecord.gems3]
          : [],
      gems4: Array.isArray(selectedRecord.gems4)
        ? selectedRecord.gems4
        : selectedRecord.gems4
          ? [selectedRecord.gems4]
          : [],

      // reset transaction-only fields
      dateOfPayment: "",
      amount: "",
      pendingAmount: "",
      refund: "",
      status: "",
      transactionId: "",
      sheet: "",
      remark: "",
      airBillNo: "",
    }));

    setMode("new");
    toast.info("User identity loaded. Add a new record.");
  };

  // ============ UI COMPONENTS ============

  const getInputType = (key) => {
    if (key === "dateOfPayment") return "date";
    if (key.toLowerCase().includes("email")) return "email";
    if (
      key.toLowerCase().includes("amount") ||
      key.toLowerCase().includes("rating") ||
      key.toLowerCase().includes("pending") ||
      key.toLowerCase().includes("refund")
    )
      return "number";
    return "text";
  };

  const inputClass =
    "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-slate-100";

  // ============ RENDER ============

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
        Loading form configuration...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <div className="mx-auto flex w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => {
            setMode("new");
            setExistingRecords([]);
            setSelectedRecord(null);
            setSearchEmail("");
            setOpenMultiDropdowns({});
            setOptionSearch({});
          }}
          className={`w-1/2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
            mode === "new"
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Add New User
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("existing");
            setOpenMultiDropdowns({});
            setOptionSearch({});
          }}
          className={`w-1/2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
            mode === "existing"
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Add to Existing User
        </button>
      </div>

      {mode === "existing" ? (
        <ExistingUserSearch
          searchEmail={searchEmail}
          setSearchEmail={setSearchEmail}
          handleUserSearch={handleUserSearch}
          existingRecords={existingRecords}
          selectedRecord={selectedRecord}
          setSelectedRecord={setSelectedRecord}
          handleEditExistingUser={handleEditExistingUser}
        />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mx-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <h3 className="mb-1 text-2xl font-bold text-slate-900">
            Add New Record
          </h3>
          <p className="mb-6 text-sm text-slate-500">
            Fill record details with required fields to create a clean entry.
          </p>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(headerLabels).map(([key, label]) => {
              if (key === "handlerId" && userRole !== "admin") return null;

              // Mobile 1 with SEPARATE country selector
              if (key === "mobile1" || key === "mobile2") {
                return (
                  <MobileFields
                    key={key}
                    name={key}
                    label={label}
                    value={formData[key]}
                    countryIso={formData[`${key}CountryIso`]}
                    required={requiredFields.includes(key)}
                    onChange={handleChange}
                    onCountryChange={handlePhoneCountryChange}
                  />
                );
              }

              const isGemField = gemFieldOrder.includes(key);
              const keyIndex = gemFieldOrder.indexOf(key);
              const parentField = keyIndex > 0 ? gemFieldOrder[keyIndex - 1] : "";
              const shouldShowGemField =
                !isGemField ||
                key === "gems" ||
                hasGemSelection(formData[parentField]);

              if (!shouldShowGemField) return null;

              const gemOptions = isGemField
                ? getGemOptionsForField(
                    key,
                    formData,
                    dropdowns.gemsHierarchy || {},
                    dropdowns.gems || [],
                  )
                : [];
              const isGemDisabled =
                isGemField &&
                key !== "gems" &&
                (!hasGemSelection(formData[parentField]) ||
                  gemOptions.length === 0);
              const dropdownOpen = Boolean(openMultiDropdowns[key]);
              const multiOptions = Array.isArray(isGemField ? gemOptions : dropdowns[key])
                ? (isGemField ? gemOptions : dropdowns[key])
                : [];
              const getOptionValue = (option) => {
                if (typeof option === "string") return option;
                if (typeof option === "number") return String(option);
                if (option && typeof option === "object") {
                  return option.name || option.label || option.value || "";
                }
                return "";
              };
              const searchTerm = (optionSearch[key] || "").toLowerCase();
              const filteredMultiOptions = multiOptions.filter((option) =>
                getOptionValue(option).toLowerCase().includes(searchTerm),
              );

              // All other fields
              return (
                <div key={key} className="flex flex-col">
                  {requiredFields.includes(key) ? (
                    <LabelWithAsterisk text={label} />
                  ) : (
                    <label
                      htmlFor={key}
                      className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {label}
                    </label>
                  )}

                  {key === "country" ? (
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleCountryChange}
                      className={inputClass}
                    >
                      <option value="">Select Country</option>
                      {dropdowns.country?.map((c) => (
                        <option key={c.isoCode} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : key === "state" ? (
                    <select
                      id={key}
                      name={key}
                      value={formData.state}
                      onChange={handleChange}
                      className={inputClass}
                      disabled={!selectedCountry}
                    >
                      <option value="">
                        {!selectedCountry
                          ? "Select country first"
                          : getStatesByCountry(selectedCountry).length
                            ? "Select State"
                            : "No states available"}
                      </option>
                      {selectedCountry &&
                        getStatesByCountry(selectedCountry).map(
                          (
                            s, // ✅ Perfect
                          ) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ),
                        )}
                    </select>
                    ) : dropdowns[key] ? (
                    multiSelectFields.includes(key) ? (
                      <div
                        ref={(node) => {
                          if (node) multiSelectRefs.current[key] = node;
                        }}
                        data-multi-select="true"
                        className="relative overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm"
                      >
                        {/* Selected Items Display */}
                        {Array.isArray(formData[key]) && formData[key].length > 0 && (
                          <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-3">
                            {formData[key].map((item) => (
                              <div
                                key={item}
                                className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800"
                              >
                                {item}
                                <button
                                  type="button"
                                  onClick={() => removeItem(key, item)}
                                  className="ml-1 text-orange-700 transition hover:text-orange-900 focus:outline-none"
                                  title="Remove"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Dropdown Toggle */}
                        <div
                          onClick={() => {
                            if (isGemDisabled) return;
                            const nextOpen = !openMultiDropdowns[key];
                            if (nextOpen) {
                              setDropdownDirection((prev) => ({
                                ...prev,
                                [key]: getDropdownOpenDirection(key),
                              }));
                            }
                            setOpenMultiDropdowns({
                              [key]: nextOpen,
                            });
                            setOptionSearch((prev) => ({
                              ...prev,
                              [key]: prev[key] || "",
                            }));
                          }}
                          className="flex cursor-pointer items-center justify-between p-3 transition hover:bg-slate-50"
                        >
                          <span className="text-sm text-slate-600">
                            {isGemDisabled
                              ? "Select parent first"
                              : Array.isArray(formData[key]) && formData[key].length > 0
                                ? `${formData[key].length} selected`
                                : `Click to select ${label.toLowerCase()}`}
                          </span>
                          <span className={`text-lg transition-transform ${
                            dropdownOpen
                              ? 'rotate-180'
                              : ''
                          }`}>
                            <ChevronDown className="w-4 h-4" />
                          </span>
                        </div>
                        {/* Scrollable Checkbox List */}
                        {dropdownOpen && !isGemDisabled && (
                          <div
                            className={`absolute left-0 right-0 z-[90] max-h-52 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl ${
                              dropdownDirection[key] === "up"
                                ? "bottom-full mb-1"
                                : "top-full mt-1"
                            }`}
                          >
                            <div className="sticky top-0 z-10 bg-white pb-2">
                              <input
                                type="text"
                                value={optionSearch[key] || ""}
                                onChange={(e) =>
                                  setOptionSearch((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                                placeholder={`Search ${label.toLowerCase()}...`}
                                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                              />
                            </div>
                            {filteredMultiOptions.map((option) => {
                              const optionValue = getOptionValue(option);
                              const selectedItems = Array.isArray(formData[key])
                                ? formData[key]
                                : formData[key]
                                  ? [formData[key]]
                                  : [];
                              const isChecked = selectedItems.includes(optionValue);
                              return (
                                <label
                                  key={optionValue}
                                  className="flex cursor-pointer items-center gap-2 rounded p-1 transition hover:bg-orange-50"
                                >
                                  <input
                                    type="checkbox"
                                    name={key}
                                    value={optionValue}
                                    checked={isChecked}
                                    onChange={handleChange}
                                    className="hidden"
                                  />
                                  {isChecked && <Check className="w-4 h-4 text-orange-600" />}
                                  <span className="flex-1 text-sm text-slate-700">{optionValue}</span>
                                </label>
                              );
                            })}
                            {filteredMultiOptions.length === 0 && (
                              <div className="px-1 py-2 text-xs text-slate-500">
                                No matching options
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <select
                        id={key}
                        name={key}
                        value={formData[key] || ""}
                        onChange={handleChange}
                        disabled={isGemDisabled}
                        className={inputClass}
                      >
                        <option value="">
                          {isGemDisabled
                            ? "Select parent first"
                            : loading
                              ? "Loading..."
                              : `Select ${label}`}
                        </option>

                        {(isGemField ? gemOptions : dropdowns[key]).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )
                  ) : (() => {
                    const inputType = getInputType(key);

                    if (inputType === "date") {
                      return (
                        <DateField
                          id={key}
                          name={key}
                          type="date"
                          value={formData[key] || ""}
                          onChange={handleChange}
                        />
                      );
                    }

                    return (
                      <input
                        id={key}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        type={inputType}
                        min={inputType === "number" ? "0" : undefined}
                        step={inputType === "number" ? "any" : undefined}
                        className={inputClass}
                        placeholder={label}
                      />
                    );
                  })()}
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`mt-6 w-full rounded-xl py-3 font-semibold text-white transition ${
              isSubmitting
                ? "cursor-not-allowed bg-slate-400"
                : "bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm hover:from-orange-600 hover:to-amber-600"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Add Record"}
          </button>
        </form>
      )}
    </div>
  );
};

export default AddRecordForm;
