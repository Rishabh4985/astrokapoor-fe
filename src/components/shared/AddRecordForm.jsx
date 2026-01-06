import React, { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { Country, State } from "country-state-city";
import {
  dropdownOptions,
  requiredFields,
  expectedHeaders,
  headerLabels,
} from "./Dropdown";
import {
  parsePhoneNumberFromString,
  getCountryCallingCode,
} from "libphonenumber-js";
import disposableDomains from "disposable-email-domains";

// ============ VALIDATION FUNCTIONS ============

const validateEmailSyntax = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);

const validateEmail = (email) => {
  if (!email) return true;
  if (!validateEmailSyntax(email)) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain || disposableDomains.includes(domain)) return false;
  return true;
};

const validatePhone = (countryIso, number) => {
  try {
    if (!countryIso || !number) return true;
    const callingCode = getCountryCallingCode(countryIso);
    const phone = parsePhoneNumberFromString(`+${callingCode}${number}`);
    return phone?.isValid() ?? false;
  } catch (error) {
    console.error("Phone validation error:", error);
    return false;
  }
};

const isValidCountry = (name) =>
  Country.getAllCountries().some((c) => c.name === name);

const isValidState = (countryIso, stateName) => {
  if (!stateName) return true;
  return State.getStatesOfCountry(countryIso).some((s) => s.name === stateName);
};

const validateName = (value) => value.trim().length >= 2;

const getCountryCodeFromIso = (isoCode) => {
  try {
    if (!isoCode) return "";
    return `+${getCountryCallingCode(isoCode)}`;
  } catch {
    return "";
  }
};

const buildFullPhone = (countryIso, number) => {
  if (!countryIso || !number) return "";
  try {
    const callingCode = getCountryCallingCode(countryIso);
    return `+${callingCode}${number}`;
  } catch {
    return number;
  }
};

// ============ MAIN COMPONENT ============

const AddRecordForm = ({ onAdd }) => {
  const { authToken, userRole } = useAuth();
  const seller = JSON.parse(localStorage.getItem("currentSeller"));
  const isSeller = !!seller?.email;

  const [formData, setFormData] = useState({
    ...expectedHeaders,
    handlerId: isSeller ? seller.email : "",
    countryIso: "", // Address country
    mobile1CountryIso: "", // Phone 1 country (SEPARATED)
    mobile2CountryIso: "", // Phone 2 country (SEPARATED)
  });

  const [mode, setMode] = useState("new");
  const [searchEmail, setSearchEmail] = useState("");
  const [existingUserData, setExistingUserData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(""); // Address country

  const countries = Country.getAllCountries();
  const states = selectedCountry
    ? State.getStatesOfCountry(selectedCountry)
    : [];

  // ============ HANDLER FUNCTIONS ============

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Address country change (does NOT affect phone countries)
  const handleCountryChange = (e) => {
    const countryName = e.target.value;
    const countryObj = countries.find((c) => c.name === countryName);
    const isoCode = countryObj?.isoCode || "";

    setFormData((prev) => ({
      ...prev,
      country: countryName,
      countryIso: isoCode,
      state: "", // Reset state when country changes
    }));

    setSelectedCountry(isoCode);
  };

  // Phone 1 country change (SEPARATE)
  const handlePhoneCountryChange = (e, phoneNumber) => {
    const countryName = e.target.value;
    const countryObj = countries.find((c) => c.name === countryName);
    const isoCode = countryObj?.isoCode || "";

    setFormData((prev) => ({
      ...prev,
      [`${phoneNumber}CountryIso`]: isoCode,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isFormValid = requiredFields.every(
      (field) => formData[field]?.toString().trim() !== ""
    );
    if (!isFormValid) {
      toast.error("Please fill up all the required fields");
      return;
    }

    if (!validateName(formData.customerName)) {
      toast.error("Invalid customer name (min 2 chars, letters only)");
      return;
    }

    if (!isValidCountry(formData.country)) {
      toast.error("Invalid Country Selected");
      return;
    }

    if (formData.state && !isValidState(formData.countryIso, formData.state)) {
      toast.error("Invalid state for selected country.");
      return;
    }

    if (formData.email1 && !validateEmail(formData.email1)) {
      toast.error("Invalid or disposable primary email.");
      return;
    }
    if (formData.email2 && !validateEmail(formData.email2)) {
      toast.error("Invalid or disposable secondary email.");
      return;
    }

    // Validate phone 1 with its own country
    if (formData.mobile1 && formData.mobile1CountryIso) {
      if (!validatePhone(formData.mobile1CountryIso, formData.mobile1)) {
        toast.error("Invalid mobile number for selected phone country.");
        return;
      }
    } else if (formData.mobile1 && !formData.mobile1CountryIso) {
      toast.error("Please select country for primary mobile number.");
      return;
    }

    // Validate phone 2 with its own country
    if (formData.mobile2 && formData.mobile2CountryIso) {
      if (!validatePhone(formData.mobile2CountryIso, formData.mobile2)) {
        toast.error("Invalid alternate mobile number.");
        return;
      }
    } else if (formData.mobile2 && !formData.mobile2CountryIso) {
      toast.error("Please select country for alternate mobile number.");
      return;
    }

    const newRecord = {
      ...formData,
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

      toast.success(
        mode === "edit"
          ? "Record Updated Successfully!"
          : "Record Added Successfully!"
      );

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

        const isDuplicate = existingUsers.some(
          (user) =>
            (user.email1 && user.email1 === newUser.email1) ||
            (user.email2 && user.email2 === newUser.email1) ||
            (user.email1 && user.email1 === newUser.email2) ||
            (user.email2 && user.email2 === newUser.email2) ||
            (user.mobile1 && user.mobile1 === newUser.mobile1) ||
            (user.mobile2 && user.mobile2 === newUser.mobile1) ||
            (user.mobile1 && user.mobile1 === newUser.mobile2) ||
            (user.mobile2 && user.mobile2 === newUser.mobile2)
        );

        if (!isDuplicate) {
          sessionStorage.setItem(
            "userList",
            JSON.stringify([...existingUsers, newUser])
          );
          toast.info("User also saved in session storage.");
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
      setExistingUserData(null);
    } catch (error) {
      console.error("Failed to add record", error);
      toast.error("Failed to add record. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSearch = async () => {
    if (!searchEmail.trim()) {
      toast.error("Please enter search keyword.");
      return;
    }

    const API_BASE = import.meta.env.DEV
      ? "http://localhost:4000/api"
      : import.meta.env.VITE_API_URL;

    const baseUrl =
      userRole === "admin"
        ? `${API_BASE}/admin`
        : userRole === "seller"
        ? `${API_BASE}/seller`
        : `${API_BASE}`;

    const url = `${baseUrl}/users/search?keyword=${encodeURIComponent(
      searchEmail.trim()
    )}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("User not found");
      const user = await response.json();

      if (user) {
        setExistingUserData(user);

        const userCountryObj = countries.find((c) => c.name === user.country);

        // Extract phone countries from full phone numbers if available
        let mobile1CountryIso = "";
        let mobile2CountryIso = "";

        if (user.mobile1) {
          // Try to match the country code from existing phone
          const countryFromPhone = countries.find((c) =>
            user.mobile1?.startsWith(`+${getCountryCallingCode(c.isoCode)}`)
          );
          mobile1CountryIso =
            countryFromPhone?.isoCode || userCountryObj?.isoCode || "";
        }

        if (user.mobile2) {
          const countryFromPhone = countries.find((c) =>
            user.mobile2?.startsWith(`+${getCountryCallingCode(c.isoCode)}`)
          );
          mobile2CountryIso =
            countryFromPhone?.isoCode || userCountryObj?.isoCode || "";
        }

        setFormData((prev) => ({
          ...prev,
          dateOfPayment: prev.dateOfPayment || "",
          customerName: user.customerName || prev.customerName || "",
          email1: user.email1 || "",
          email2: user.email2 || "",
          mobile1: user.mobile1?.replace(/^\+\d+/, "") || "", // Remove country code
          mobile2: user.mobile2?.replace(/^\+\d+/, "") || "",
          country: user.country || "",
          countryIso: userCountryObj?.isoCode || "",
          mobile1CountryIso: mobile1CountryIso, // Set phone country separately
          mobile2CountryIso: mobile2CountryIso,
          state: user.state || "",
          address: user.address || "",
          expert: user.expert || "",
          handlerId: user.handlerId || "",
          handleBy: user.handleBy || "",
          service: user.service || "",
          status: user.status || "",
          amount: user.amount || "",
          pendingAmount: user.pendingAmount || "",
          refund: user.refund || "",
        }));

        setSelectedCountry(userCountryObj?.isoCode || "");
        toast.success("User found and data imported.");
      } else {
        setExistingUserData(null);
        toast.error("No user found with this input.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error searching user.");
    }
  };

  const handleEditExistingUser = () => {
    if (!existingUserData) return;

    setFormData((prev) => ({
      ...prev,
      ...existingUserData,
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
    toast.info("User data loaded. You can now add a new record.");
  };

  // ============ UI COMPONENTS ============

  const LabelWithAsterisk = ({ text }) => (
    <label className="text-sm text-gray-700 mb-1">
      {text} <span className="text-red-500">*</span>
    </label>
  );

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

  const isMobile1CountrySelected = !!formData.mobile1CountryIso;
  const isMobile2CountrySelected = !!formData.mobile2CountryIso;

  // ============ RENDER ============

  return (
    <div className="mt-8 px-4">
      <div className="flex justify-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode("new");
            setExistingUserData(null);
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
        <div className="bg-white p-6 rounded-2xl shadow max-w-4xl mx-auto">
          <h3 className="text-xl font-bold mb-4 text-orange-800">
            Search Existing User
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              placeholder="Search by Email or Mobile"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="flex-1 border border-gray-300 px-4 py-2 rounded-lg"
            />
            <button
              type="button"
              onClick={handleUserSearch}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
            >
              Search
            </button>
          </div>

          {existingUserData && (
            <div className="border p-4 rounded bg-gray-50 space-y-2">
              <h4 className="text-lg font-semibold mb-2 text-orange-700">
                User Details:
              </h4>
              {Object.entries(existingUserData).map(([key, val]) => (
                <p key={key}>
                  <span className="font-medium">
                    {headerLabels[key] || key}:
                  </span>{" "}
                  {val || "N/A"}
                </p>
              ))}
              <button
                onClick={handleEditExistingUser}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add New Record for This User
              </button>
            </div>
          )}
        </div>
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
              if (isSeller && key === "handlerId") return null;

              // Mobile 1 with SEPARATE country selector
              if (key === "mobile1") {
                return (
                  <div key={key} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      {requiredFields.includes(key) ? (
                        <LabelWithAsterisk text={label} />
                      ) : (
                        <label className="text-sm text-gray-700">{label}</label>
                      )}

                      {!isMobile1CountrySelected && (
                        <span className="text-xs text-amber-600 font-medium whitespace-nowrap">
                          Select country first
                        </span>
                      )}
                    </div>

                    <div className="flex w-full rounded-lg border border-gray-300 overflow-hidden">
                      {/* Phone 1 Country Selector (INDEPENDENT) */}
                      <select
                        value={
                          countries.find(
                            (c) => c.isoCode === formData.mobile1CountryIso
                          )?.name || ""
                        }
                        onChange={(e) => handlePhoneCountryChange(e, "mobile1")}
                        className="bg-gray-100 text-sm px-1 outline-none border-r border-gray-300 max-w-[120px]"
                      >
                        <option value="">Country</option>
                        {countries.map((c) => (
                          <option key={c.isoCode} value={c.name}>
                            {c.isoCode} {getCountryCodeFromIso(c.isoCode)}
                          </option>
                        ))}
                      </select>

                      <input
                        id={key}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        type="tel"
                        placeholder="Mobile number"
                        disabled={!isMobile1CountrySelected}
                        className="flex-1 px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
                );
              }

              // Mobile 2 with SEPARATE country selector
              if (key === "mobile2") {
                return (
                  <div key={key} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      {requiredFields.includes(key) ? (
                        <LabelWithAsterisk text={label} />
                      ) : (
                        <label className="text-sm text-gray-700">{label}</label>
                      )}

                      {!isMobile2CountrySelected && (
                        <span className="text-xs text-amber-600 font-medium whitespace-nowrap">
                          Select country first
                        </span>
                      )}
                    </div>

                    <div className="flex w-full rounded-lg border border-gray-300 overflow-hidden">
                      {/* Phone 2 Country Selector (INDEPENDENT) */}
                      <select
                        value={
                          countries.find(
                            (c) => c.isoCode === formData.mobile2CountryIso
                          )?.name || ""
                        }
                        onChange={(e) => handlePhoneCountryChange(e, "mobile2")}
                        className="bg-gray-100 text-sm px-1 outline-none border-r border-gray-300 max-w-[120px]"
                      >
                        <option value="">Country</option>
                        {countries.map((c) => (
                          <option key={c.isoCode} value={c.name}>
                            {c.isoCode} {getCountryCodeFromIso(c.isoCode)}
                          </option>
                        ))}
                      </select>

                      <input
                        id={key}
                        name={key}
                        value={formData[key]}
                        onChange={handleChange}
                        type="tel"
                        placeholder="Alternate mobile number"
                        disabled={!isMobile2CountrySelected}
                        className="flex-1 px-3 py-2 text-sm outline-none"
                      />
                    </div>
                  </div>
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
                      {countries.map((c) => (
                        <option key={c.isoCode} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : key === "state" ? (
                    <select
                      id={key}
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="">Select State</option>
                      {states.length > 0 ? (
                        states.map((s) => (
                          <option key={s.isoCode} value={s.name}>
                            {s.name}
                          </option>
                        ))
                      ) : (
                        <option disabled>No states available</option>
                      )}
                    </select>
                  ) : dropdownOptions[key] ? (
                    <select
                      id={key}
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="">Select {label}</option>
                      {dropdownOptions[key].map((option) => (
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
