import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { UserPlus, List, Trash2, Pencil, Loader2 } from "lucide-react";

const ManageSalesPerson = () => {
  const [activeTab, setActiveTab] = useState("add");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [salespersons, setSalespersons] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("authToken");
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchSalespersons = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/admin/sellers`, {
        headers: { Authorization: `Bearer ${token}` },
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
      toast.error("Failed to fetch salespersons");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchSalespersons();
  }, [fetchSalespersons]);

  const handleAdd = async () => {
    if (!firstName || !lastName || !email || !password) {
      return toast.error("All fields are required.");
    }

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
    };

    try {
      await axios.post(`${API_URL}/admin/sellers`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Salesperson added successfully!");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      fetchSalespersons();
      setActiveTab("list");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error adding salesperson");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this salesperson?"))
      return;

    try {
      await axios.delete(`${API_URL}/admin/sellers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Salesperson deleted.");
      fetchSalespersons();
    } catch {
      toast.error("Failed to delete salesperson.");
    }
  };

  const handleEdit = async (id) => {
    const newPassword = prompt("Enter new password:");
    if (!newPassword) return;

    try {
      await axios.patch(
        `${API_URL}/admin/sellers/${id}`,
        { password: newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Password updated.");
      fetchSalespersons();
    } catch {
      toast.error("Failed to update password.");
    }
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
                  </label>
                  <input
                    type={
                      label === "Password"
                        ? "password"
                        : label === "Email"
                        ? "email"
                        : "text"
                    }
                    value={
                      i === 0
                        ? firstName
                        : i === 1
                        ? lastName
                        : i === 2
                        ? email
                        : password
                    }
                    onChange={(e) =>
                      i === 0
                        ? setFirstName(e.target.value)
                        : i === 1
                        ? setLastName(e.target.value)
                        : i === 2
                        ? setEmail(e.target.value)
                        : setPassword(e.target.value)
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              )
            )}

            <button
              onClick={handleAdd}
              className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition font-medium"
            >
              Save Salesperson
            </button>
          </div>
        </div>
      )}

      {activeTab === "list" && (
        <div className="overflow-x-auto mt-4">
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
              <thead className="bg-orange-100 text-orange-900">
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
    </div>
  );
};

export default ManageSalesPerson;
