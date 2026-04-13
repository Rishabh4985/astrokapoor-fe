import React, { useState, useEffect, useCallback } from "react";
import { Lock, Mail, User, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE,
});

const AdminProfile = () => {
  const { authToken, userRole, logout } = useAuth();
  const [adminData, setAdminData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
    profilePicFile: null,
  });

  const [message, setMessage] = useState("");

  const handleUnauthorizedError = useCallback(
    (err, fallbackMessage = "Session expired. Please login again.") => {
      const statusCode = err?.response?.status;
      if (statusCode !== 401 && statusCode !== 403) {
        return false;
      }
      setMessage(err?.response?.data?.message || fallbackMessage);
      logout();
      return true;
    },
    [logout],
  );

  const fetchProfile = useCallback(async () => {
    if (!authToken || userRole !== "admin") {
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    try {
      const res = await api.get("/admin/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setAdminData(res.data);
      setFormState((prev) => ({ ...prev, name: res.data.name }));
      setMessage("");
    } catch (err) {
      if (handleUnauthorizedError(err)) {
        return;
      }
      console.error("Failed to fetch admin profile:", err);
      setAdminData(null);
      setMessage("Failed to load profile.");
    } finally {
      setProfileLoading(false);
    }
  }, [authToken, userRole, handleUnauthorizedError]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const { name, currentPassword, newPassword, confirmNewPassword } =
      formState;

    if (!authToken || userRole !== "admin") {
      setMessage("Unauthorized access.");
      return;
    }

    const wantsPasswordChange =
      Boolean(currentPassword) || Boolean(newPassword) || Boolean(confirmNewPassword);

    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        setMessage("All password fields are required.");
        return;
      }
      if (newPassword.length < 6) {
        setMessage("New password must be at least 6 characters long.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setMessage("New passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      if (wantsPasswordChange) {
        await api.patch(
          "/admin/update-password",
          { currentPassword, newPassword },
          { headers: { Authorization: `Bearer ${authToken}` } },
        );
      }

      const res = await api.patch(
        "/admin/me",
        { name },
        { headers: { Authorization: `Bearer ${authToken}` } },
      );
      setAdminData(res.data);
      setMessage(
        wantsPasswordChange
          ? "Password and profile updated successfully."
          : "Profile updated successfully.",
      );
      setIsEditing(false);
      setFormState((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      }));
    } catch (err) {
      if (handleUnauthorizedError(err)) {
        return;
      }
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="text-center py-10 text-gray-500">Loading profile...</div>
    );
  }

  if (!adminData) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-700">
          {message || "Failed to load profile."}
        </p>
        <button
          type="button"
          onClick={fetchProfile}
          className="mt-4 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-2xl shadow-md border border-orange-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-orange-800 flex items-center gap-2">
          <User className="w-6 h-6" /> Admin Profile
        </h2>
        <button
          type="button"
          onClick={() => {
            if (isEditing) {
              setFormState((prev) => ({
                ...prev,
                name: adminData.name,
                currentPassword: "",
                newPassword: "",
                confirmNewPassword: "",
              }));

              setMessage("");
            }
            setIsEditing((prev) => !prev);
          }}
          className={`px-4 py-1 rounded-md font-medium border ${
            isEditing
              ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
              : "bg-orange-100 text-orange-800 hover:bg-orange-200"
          }`}
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Name</label>
          <input
            type="text"
            name="name"
            className="w-full border border-orange-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={formState.name}
            onChange={handleInputChange}
            required
            disabled={!isEditing || loading}
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Email
          </label>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 text-gray-700 border border-gray-200">
            <Mail className="w-4 h-4" />
            <span>{adminData.email}</span>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-orange-700 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </h3>

            <div className="mt-3 space-y-3">
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  placeholder="Current Password"
                  aria-label="Current Password"
                  className="w-full border border-orange-200 rounded-lg p-2 pr-10"
                  value={formState.currentPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-600"
                  disabled={loading}
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  placeholder="New Password"
                  aria-label="New Password"
                  className="w-full border border-orange-200 rounded-lg p-2 pr-10"
                  value={formState.newPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-600"
                  disabled={loading}
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmNewPassword"
                  placeholder="Confirm New Password"
                  aria-label="Confirm New Password"
                  className="w-full border border-orange-200 rounded-lg p-2 pr-10"
                  value={formState.confirmNewPassword}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-600"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {isEditing && (
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 rounded-lg mt-4 font-semibold shadow text-white ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-600 hover:bg-orange-700"
            }`}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        )}

        {message && (
          <p
            className={`text-center mt-4 font-medium ${
              message.toLowerCase().includes("success")
                ? "text-green-700"
                : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default AdminProfile;
