import React, { useState, useContext } from "react";
import { useAuth } from "../../context/AuthContext";
import OptionsContext from "../../context/OptionsContext";
import { toast } from "react-toastify";
import MobileFields from "./MobileFields";
import ExistingUserSearch from "./ExistingUserSearch";
import { expectedHeaders, headerLabels } from "../../utils/utils";
import {
  validateEmail,
  validateName,
  validatePhone,
  isValidCountry,
  isValidState,
  stripCountryCode,
  detectPhoneIso,
  buildFullPhone,
} from "../../utils/formUtils";

const LabelWithAsterisk = ({ text }) => (
  <label className="text-sm text-gray-700 mb-1">
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
  const { dropdowns, requiredFields, loading, getStatesByCountry } =
    useContext(OptionsContext);

  // ============ HANDLER FUNCTIONS ============

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    if (!isValidCountry(formData.countryIso, dropdowns.country))
      return "Invalid country selected";

    if (
      formData.state &&
      !isValidState(
        formData.countryIso,
        formData.state,
        getStatesByCountry(formData.countryIso),
      )
    )
      return "Invalid state for selected country";

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
    } catch (error) {
      const errorMsg = error?.message || "Failed to add record. Please try again.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSearch = async () => {
    if (!searchEmail.trim()) {
      toast.error("Please enter search keyword.");
      return;
    }
    const API_BASE = import.meta.env.VITE_API_URL;

    const baseUrl =
      userRole === "admin"
        ? `${API_BASE}/admin`
        : userRole === "seller"
          ? `${API_BASE}/seller`
          : `${API_BASE}`;

    const url = `${baseUrl}/users/search?keyword=${encodeURIComponent(
      searchEmail.trim(),
    )}`;

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
          handleBy: selected.handleBy || "",
          service: selected.service || "",
          status: selected.status || "",
          amount: selected.amount || "",
          pendingAmount: selected.pendingAmount || "",
          refund: selected.refund || "",
        }));

        setSelectedCountry(userCountryObj?.isoCode || "");
        toast.success("User found and data imported.");
      } else {
        setExistingRecords([]);
        setSelectedRecord(null);
        toast.error("No user found with this input.");
      }
    } catch (error) {
      const errorMsg = error?.message || "Could not search for user. Please try again.";
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
      handleBy: selectedRecord.handleBy || "",

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

  // ============ RENDER ============

  if (loading) {
    return (
      <div className="text-center mt-10 text-gray-600">
        Loading form configuration...
      </div>
    );
  }

  return (
    <div className="mt-8 px-4">
      <div className="flex justify-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode("new");
            setExistingRecords([]);
            setSelectedRecord(null);
            setSearchEmail("");
          }}
          className={`px-5 py-2 rounded-lg transition-all duration-200 ${
            mode === "new"
              ? "bg-orange-600 text-white shadow"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Add New User
        </button>
        <button
          type="button"
          onClick={() => setMode("existing")}
          className={`px-5 py-2 rounded-lg transition-all duration-200 ${
            mode === "existing"
              ? "bg-orange-600 text-white shadow"
              : "bg-gray-200 text-gray-700"
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
          className="bg-white p-6 rounded-2xl shadow max-w-7xl mx-auto"
        >
          <h3 className="text-xl font-bold mb-6 text-orange-800">
            Add New Record
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[70vh] overflow-y-auto pr-2">
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

              // All other fields (unchanged logic)
              return (
                <div key={key} className="flex flex-col">
                  {requiredFields.includes(key) ? (
                    <LabelWithAsterisk text={label} />
                  ) : (
                    <label htmlFor={key} className="text-sm text-gray-700 mb-1">
                      {label}
                    </label>
                  )}

                  {key === "country" ? (
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleCountryChange}
                      className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
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
                      className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
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
                    <select
                      id={key}
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="">
                        {loading ? "Loading..." : `Select ${label}`}
                      </option>

                      {dropdowns[key].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={key}
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      type={getInputType(key)}
                      min={getInputType(key) === "number" ? "0" : undefined}
                      step={getInputType(key) === "number" ? "any" : undefined}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                      placeholder={label}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`mt-6 w-full py-3 rounded-lg font-semibold ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-600 hover:bg-orange-700 text-white"
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
