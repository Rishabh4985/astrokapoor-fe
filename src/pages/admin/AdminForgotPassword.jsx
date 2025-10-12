import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:4000"
  : import.meta.env.VITE_API_URL;


const AdminForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/send-otp`, { email });

      setMessage(
        res.data.message || "OTP sent to your email. Please check your inbox."
      );
      setTimeout(() => {
        navigate("/admin/verify-otp", { state: { email } });
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-orange-700 text-center">
          Forgot Password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <input
            type="email"
            required
            placeholder="Enter registered admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Registered admin email"
            className="w-full px-4 py-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-white transition ${
              loading
                ? "bg-orange-300 cursor-not-allowed"
                : "bg-orange-600 hover:bg-orange-700"
            } focus:outline-none focus:ring-2 focus:ring-orange-500`}
            aria-busy={loading}
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>

          {message && (
            <p
              className={`text-center text-sm mt-3 ${
                message.toLowerCase().includes("failed")
                  ? "text-red-600"
                  : "text-gray-700"
              }`}
              role="alert"
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
