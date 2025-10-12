import React, { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

const defaultFormData = {
  dateOfPayment: "",
  customerName: "",
  amount: "",
  pendingAmount: "",
  refund: "",
  status: "",
  service: "",
  mobile1: "",
  mobile2: "",
  email1: "",
  email2: "",
  expert: "",
  handlerId: "",
  handleBy: "",
  mode: "",
  country: "",
  state: "",
  transactionId: "",
  sheet: "",
  remark: "",
  gems: "",
  gems1: "",
  gems2: "",
  gems3: "",
  gems4: "",
  communication: "",
  solutions: "",
  solDetails: "",
  overallRating: "",
  remarks: "",
  qualityDesc: "",
  feedStatus: "",
  additionalInfo: "",
  feedbackComment: "",
  address: "",
  airBillNo: "",
  productsName: "",
  skuNo: "",
  category: "",
};

const requiredFields = ["dateOfPayment", "customerName", "amount", "service"];

const AddRecordForm = ({ onAdd }) => {
  const { authToken, userRole } = useAuth();
  const seller = JSON.parse(localStorage.getItem("currentSeller"));
  const isSeller = !!seller?.email;
  const [formData, setFormData] = useState({
    ...defaultFormData,
    handlerId: isSeller ? seller.email : "",
  });
  const [mode, setMode] = useState("new");
  const [searchEmail, setSearchEmail] = useState("");
  const [existingUserData, setExistingUserData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value.trim() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isFormValid = requiredFields.every(
      (field) => formData[field]?.toString().trim() !== ""
    );

    if (!isFormValid) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      const sellerEmail = seller?.email?.toLowerCase().trim();
      const isSeller = !!seller?.email;

      const newRecord = {
        ...formData,
        dateOfPayment: new Date(formData.dateOfPayment || Date.now()),
        handlerId: isSeller ? seller.email : formData.handlerId || "admin",
      };

      await onAdd(newRecord);

      toast.success(
        mode === "edit"
          ? "Record Updated Successfully!"
          : "Record Added Successfully!"
      );

      if (mode === "new") {
        const newUser = {
          email1: formData.email1?.toLowerCase(),
          email2: formData.email2?.toLowerCase(),
          mobile1: formData.mobile1,
          mobile2: formData.mobile2,
          customerName: formData.customerName,
          country: formData.country,
          state: formData.state,
          address: formData.address,
        };

        const existingUsers =
          JSON.parse(sessionStorage.getItem("userList")) || [];

        const isDuplicate = existingUsers.some(
          (user) =>
            user.email1 === newUser.email1 ||
            user.email2 === newUser.email1 ||
            user.email1 === newUser.email2 ||
            user.email2 === newUser.email2 ||
            user.mobile1 === newUser.mobile1 ||
            user.mobile2 === newUser.mobile1 ||
            user.mobile1 === newUser.mobile2 ||
            user.mobile2 === newUser.mobile2
        );

        if (!isDuplicate) {
          sessionStorage.setItem(
            "userList",
            JSON.stringify([...existingUsers, newUser])
          );
          toast.info("User also saved in session storage.");
        }
      }

      setFormData({
        ...defaultFormData,
        handlerId: sellerEmail || "admin",
      });
      setMode("new");
      setSearchEmail("");
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

    const API_BASE = import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL;

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
        setFormData((prev) => ({
          ...prev,
          dateOfPayment: prev.dateOfPayment || "",
          customerName: user.customerName || prev.customerName || "",
          email1: user.email1 || "",
          email2: user.email2 || "",
          mobile1: user.mobile1 || "",
          mobile2: user.mobile2 || "",
          country: user.country || "",
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

  const fieldLabelMap = {
    dateOfPayment: "Date of Payment",
    customerName: "Customer Name",
    amount: "Amount",
    pendingAmount: "Pending Amount",
    refund: "Refund",
    status: "Status",
    service: "Service",
    mobile1: "Mobile 1",
    mobile2: "Mobile 2",
    email1: "Email 1",
    email2: "Email 2",
    expert: "Expert",
    handlerId: "Handler ID",
    handleBy: "Handle By",
    mode: "Mode",
    country: "Country",
    state: "State",
    transactionId: "Transaction ID",
    sheet: "Sheet",
    remark: "Remark",
    gems: "Gems",
    gems1: "Gems 1",
    gems2: "Gems 2",
    gems3: "Gems 3",
    gems4: "Gems 4",
    communication: "Communication",
    solutions: "Solutions",
    solDetails: "Sol Details",
    overallRating: "Overall Rating",
    remarks: "Remarks",
    qualityDesc: "Quality Desc",
    feedStatus: "Feed Status",
    additionalInfo: "Additional Info",
    feedbackComment: "Feedback Comment",
    address: "Address",
    airBillNo: "Air Bill No.",
    productsName: "Product Name",
    skuNo: "SKU NO.",
    category: "Category",
  };

  const LabelWithAsterisk = ({ text }) => (
    <label className="text-sm text-gray-700 mb-1">
      {text} <span className="text-red-500">*</span>
    </label>
  );

  const dropdownOptions = {
    status: ["Paid", "Pending", "Refunded"],
    service: ["Consultation", "Gemstones", "Products"],
    mode: ["Cash", "UPI", "Bank Transfer"],
    country: ["India", "USA", "UK", "Canada", "Australia", "Other"],
    state: ["Delhi", "Maharashtra", "Karnataka", "UP", "Other"],
    category: ["Consultation", "Products", "Gemstones"],
  };

  const getInputType = (key) => {
    if (key === "dateOfPayment") return "date";
    if (key.toLowerCase().includes("email")) return "email";
    if (
      key.toLowerCase().includes("amount") ||
      key.toLowerCase().includes("rating")
    )
      return "number";
    return "text";
  };

  return (
    <div className="mt-8 px-4">
      <div className="flex justify-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setMode("new")}
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
                    {fieldLabelMap[key] || key}:
                  </span>{" "}
                  {val}
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
            {Object.entries(fieldLabelMap).map(([key, label]) => {
              if (isSeller && key === "handlerId") return null;

              return (
                <div key={key} className="flex flex-col">
                  {requiredFields.includes(key) ? (
                    <LabelWithAsterisk text={label} />
                  ) : (
                    <label htmlFor={key} className="text-sm text-gray-700 mb-1">
                      {label}
                    </label>
                  )}

                  {dropdownOptions[key] ? (
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
                      onKeyDown={(e) => {
                        if (
                          getInputType(key) === "number" &&
                          (e.key === "-" || e.key === "e")
                        ) {
                          e.preventDefault();
                        }
                      }}
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
