import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

const AdminVerifyOtp = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => {
    const emailFromState =
      typeof state?.email === "string" ? state.email.trim() : "";
    if (emailFromState) return emailFromState;
    return sessionStorage.getItem("adminResetEmail") || "";
  });

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (email) {
      sessionStorage.setItem("adminResetEmail", email.trim());
    }
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setAttemptsRemaining(null);
    setRetryAfterSeconds(null);

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      return setMessage("Admin email is required.");
    }

    if (newPassword !== confirmPassword) {
      return setMessage("Passwords do not match.");
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE}/admin/reset-password`, {
        email: normalizedEmail,
        otp,
        newPassword,
      });

      sessionStorage.removeItem("adminResetEmail");
      setAttemptsRemaining(null);
      setRetryAfterSeconds(null);
      setMessage("Password reset successfully. Redirecting to login...");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      const data = err?.response?.data || {};
      const statusCode = err?.response?.status;
      const apiMessage = data?.message || "Failed to reset password.";
      const remaining =
        Number.isFinite(data?.attemptsRemaining) ? data.attemptsRemaining : null;
      const retrySeconds =
        Number.isFinite(data?.retryAfterSeconds) ? data.retryAfterSeconds : null;

      setAttemptsRemaining(remaining);
      setRetryAfterSeconds(retrySeconds);

      if (statusCode === 429 && retrySeconds) {
        const minutes = Math.ceil(retrySeconds / 60);
        setMessage(`${apiMessage} Please retry in ~${minutes} minute(s).`);
      } else {
        setMessage(apiMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const showAttemptsRemaining =
    Number.isFinite(attemptsRemaining) && attemptsRemaining >= 0;
  const showRetryTimer =
    Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-orange-700">Verify OTP</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Registered admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-2 border border-orange-200 rounded-xl"
          />
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-2 border border-orange-200 rounded-xl"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-2 border border-orange-200 rounded-xl"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-2 border border-orange-200 rounded-xl"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-2 rounded-xl hover:bg-orange-700"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          {message && (
            <p className="text-sm text-center mt-2 text-gray-700">{message}</p>
          )}
          {showAttemptsRemaining && (
            <p className="text-sm text-center mt-1 text-orange-700">
              Attempts remaining:{" "}
              <span className="font-semibold">{attemptsRemaining}</span>
            </p>
          )}
          {showRetryTimer && (
            <p className="text-sm text-center mt-1 text-orange-700">
              Retry after:{" "}
              <span className="font-semibold">
                {Math.ceil(retryAfterSeconds / 60)} minute(s)
              </span>
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminVerifyOtp;
