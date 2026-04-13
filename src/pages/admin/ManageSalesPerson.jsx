import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { UserPlus, List, Trash2, Pencil, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const ManageSalesPerson = () => {
  const { authToken, userRole, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("add");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [salespersons, setSalespersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL;

  const handleUnauthorizedError = useCallback(
    (err, fallbackMessage = "Session expired. Please login again.") => {
      const statusCode = err?.response?.status;
      if (statusCode !== 401 && statusCode !== 403) {
        return false;
      }

      toast.error(err?.response?.data?.message || fallbackMessage);
      logout();
      return true;
    },
    [logout],
  );

  const fetchSalespersons = useCallback(async () => {
    if (!authToken || userRole !== "admin") return;

    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/admin/sellers`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (Array.isArray(data)) {
        setSalespersons(data);
      } else if (Array.isArray(data.salespersons)) {
        setSalespersons(data.salespersons);
      } else {
        setSalespersons([]);
        toast.error("Unexpected response format for salespersons.");
      }
    } catch (error) {
      if (handleUnauthorizedError(error)) {
        return;
      }
      toast.error("Failed to fetch salespersons");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [authToken, userRole, API_BASE, handleUnauthorizedError]);

  useEffect(() => {
    fetchSalespersons();
  }, [fetchSalespersons]);

  const handleAdd = async () => {
    if (isAdding) return;

    if (!firstName || !email || !password) {
      return toast.error("All fields are required.");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters long.");
    }

    const payload = {
      firstName: firstName.trim(),
      email: email.trim(),
      password,
      ...(lastName.trim() && { lastName: lastName.trim() }),
    };

    try {
      setIsAdding(true);
      await axios.post(`${API_BASE}/admin/sellers`, payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      toast.success("Salesperson added successfully!");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      fetchSalespersons();
      setActiveTab("list");
    } catch (err) {
      if (handleUnauthorizedError(err)) {
        return;
      }
      toast.error(err?.response?.data?.message || "Error adding salesperson");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this salesperson?"))
      return;

    try {
      await axios.delete(`${API_BASE}/admin/sellers/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      toast.success("Salesperson deleted.");
      fetchSalespersons();
    } catch (err) {
      if (handleUnauthorizedError(err)) {
        return;
      }
      toast.error("Failed to delete salesperson.");
    }
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setEditPassword("");
    setShowEditPassword(false);
  };

  const handleEditPasswordSubmit = async () => {
    const trimmedPassword = editPassword.trim();
    
    if (!trimmedPassword) {
      return toast.error("Password cannot be empty.");
    }

    if (trimmedPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long.");
    }

    try {
      await axios.patch(
        `${API_BASE}/admin/sellers/${editingId}`,
        { password: trimmedPassword },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );
      toast.success("Password updated successfully.");
      setEditingId(null);
      setEditPassword("");
      setShowEditPassword(false);
      fetchSalespersons();
    } catch (err) {
      if (handleUnauthorizedError(err)) {
        return;
      }
      const errorMsg = err?.response?.data?.message || "Failed to update password.";
      toast.error(errorMsg);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditPassword("");
    setShowEditPassword(false);
  };

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-2xl font-bold text-orange-800 mb-6">
        Manage Salesperson
      </h2>

      <div className="flex justify-center mb-6">
        <button
          onClick={() => setActiveTab("add")}
          className={`flex items-center gap-2 px-5 py-2 rounded-l-lg transition ${
            activeTab === "add"
              ? "bg-orange-600 text-white shadow"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <UserPlus size={18} />
          Add
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-2 px-5 py-2 rounded-r-lg transition ${
            activeTab === "list"
              ? "bg-orange-600 text-white shadow"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          <List size={18} />
          List
        </button>
      </div>

      {activeTab === "add" && (
        <div className="flex justify-center">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-5 border border-orange-100">
            <h3 className="text-lg font-semibold text-center text-orange-700">
              Add New Salesperson
            </h3>

            {["First Name", "Last Name", "Email", "Password"].map(
              (label, i) => (
                <div key={label}>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    {label}
                    {(i === 0 || i === 2 || i === 3) && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  {label === "Password" ? (
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password (min 6 characters)"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-600"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  ) : (
                    <input
                      type={
                        label === "Email"
                          ? "email"
                          : "text"
                      }
                      value={
                        i === 0
                          ? firstName
                          : i === 1
                            ? lastName
                            : email
                      }
                      onChange={(e) =>
                        i === 0
                          ? setFirstName(e.target.value)
                          : i === 1
                            ? setLastName(e.target.value)
                            : setEmail(e.target.value)
                      }
                      placeholder={
                        i === 0
                          ? "Enter first name"
                          : i === 1
                            ? "Enter last name (optional)"
                            : "Enter email address"
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  )}
                </div>
              ),
            )}

            <button
              onClick={handleAdd}
              disabled={isAdding}
              className={`w-full py-2 rounded-lg transition font-medium ${
                isAdding
                  ? "bg-gray-400 cursor-not-allowed text-gray-100"
                  : "bg-orange-600 text-white hover:bg-orange-700"
              }`}
            >
              {isAdding ? "Saving..." : "Save Salesperson"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "list" && (
        <div className="mt-4 max-h-[65vh] overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center py-10 text-orange-600">
              <Loader2 className="animate-spin w-6 h-6 mr-2" />
              Loading...
            </div>
          ) : salespersons.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No salespersons added yet.
            </p>
          ) : (
            <table className="w-full border text-sm rounded-lg overflow-hidden shadow-sm">
              <thead className="sticky top-0 z-10 bg-orange-100 text-orange-900">
                <tr>
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {salespersons.map((sp) => (
                  <tr key={sp._id} className="even:bg-gray-50">
                    <td className="border p-2 text-center font-medium">
                      {sp.firstName} {sp.lastName}
                    </td>
                    <td className="border p-2 text-center">{sp.email}</td>
                    <td className="border p-2">
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          onClick={() => handleEdit(sp._id)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(sp._id)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ====== PASSWORD EDIT MODAL ====== */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-orange-100">
            <h3 className="text-lg font-semibold text-orange-700 mb-4">
              Update Password
            </h3>

            <div className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password (minimum 6 characters)
                </label>
                <input
                  type={showEditPassword ? "text" : "password"}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword((prev) => !prev)}
                  className="absolute right-3 top-8 text-gray-500 hover:text-orange-600"
                >
                  {showEditPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleEditPasswordSubmit}
                  disabled={!editPassword || editPassword.trim().length < 6}
                  className={`flex-1 py-2 rounded-lg font-medium transition ${
                    !editPassword || editPassword.trim().length < 6
                      ? "bg-gray-400 cursor-not-allowed text-gray-500"
                      : "bg-orange-600 hover:bg-orange-700 text-white"
                  }`}
                >
                  Save Password
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>

              {editPassword && editPassword.length < 6 && (
                <p className="text-red-600 text-sm text-center">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSalesPerson;
