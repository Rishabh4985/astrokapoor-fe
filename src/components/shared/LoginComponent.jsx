import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

//Login and Signup
const LoginComponent = ({ onLogin }) => {
  const [mode, setMode] = useState("seller");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API_URL = import.meta.env.DEV
  ? "http://localhost:4000/api"
  : import.meta.env.VITE_API_URL;


  //handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password,
        role: mode,
      });

      const { token, user, role } = response.data;
      console.log("Login response:", response.data);

      if (role !== mode) {
        setError(`Invalid credentials for ${mode} login`);
        return;
      }

      localStorage.setItem("authToken", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userRole", role);

      setError("");
      onLogin(role, token, user);
    } catch (err) {
      console.log(err);
      setError(err?.response?.data?.message || "Invalid Credentials Try Again");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-orange-700 mb-6">
          {mode === "admin" ? "Admin Login" : "Seller Login"}
        </h2>

        <div className="flex justify-center mb-6">
          {/* seller */}
          <button
            className={`px-6 py-2 font-semibold transition rounded-l-full ${
              mode === "seller"
                ? "bg-orange-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => {
              setMode("seller");
              setError("");
              setEmail("");
              setPassword("");
            }}
          >
            Seller
          </button>

          {/* admin */}
          <button
            className={`px-6 py-2 font-semibold transition rounded-r-full ${
              mode === "admin"
                ? "bg-orange-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => {
              setMode("admin");
              setError("");
              setEmail("");
              setPassword("");
            }}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full px-4 py-2 border border-orange-200 rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-500 hover:text-orange-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-2.5 rounded-xl font-semibold hover:bg-orange-700 transition"
          >
            {mode === "admin" ? "Login as Admin" : "Login as Seller"}
          </button>

          {mode === "admin" && (
            <div className="text-right text-sm">
              <button
                type="button"
                onClick={() => navigate("/admin/forgot-password")}
                className="text-orange-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginComponent;
