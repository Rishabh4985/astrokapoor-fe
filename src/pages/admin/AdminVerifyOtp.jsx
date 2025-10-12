import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:4000/api"
  : import.meta.env.VITE_API_URL;


const AdminVerifyOtp = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const email = state?.email || "";

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (newPassword !== confirmPassword) {
      return setMessage("Passwords do not match.");
    }

    try {
     await axios.post(`${API_BASE}/admin/reset-password`, {
  email,
  otp,
  newPassword,
});


      setMessage("Password reset successfully. Redirecting to login...");
      setTimeout(() => navigate("/admin/login"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to reset password.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-orange-700">Verify OTP</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="w-full px-4 py-2 border border-orange-200 rounded-xl"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-orange-200 rounded-xl"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-orange-200 rounded-xl"
          />
          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-2 rounded-xl hover:bg-orange-700"
          >
            Reset Password
          </button>
          {message && (
            <p className="text-sm text-center mt-2 text-gray-700">{message}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminVerifyOtp;
