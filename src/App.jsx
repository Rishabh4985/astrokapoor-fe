import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminRoutes from "./routes/AdminRoutes";
import SellerRoutes from "./routes/SellerRoutes";
import { useAuth } from "./context/AuthContext";
import AdminProvider from "./context/AdminProvider";
import SellerProvider from "./context/SellerProvider";
import Login from "./pages/Login";
import AdminForgotPassword from "./pages/admin/AdminForgotPassword";
import AdminVerifyOtp from "./pages/admin/AdminVerifyOtp";

function App() {
  const { userRole, isAuthenticated } = useAuth();
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/admin/forgot-password"
          element={<AdminForgotPassword />}
        />
        <Route path="/admin/verify-otp" element={<AdminVerifyOtp />} />

        <Route
          path="/admin/*"
          element={
            <AdminProvider>
              <AdminRoutes />
            </AdminProvider>
          }
        />

        <Route
          path="/seller/*"
          element={
            <SellerProvider>
              <SellerRoutes />
            </SellerProvider>
          }
        />

        <Route
          path="*"
          element={
            isAuthenticated && userRole === "admin" ? (
              <Navigate to="/admin" replace />
            ) : isAuthenticated && userRole === "seller" ? (
              <Navigate to="/seller" replace />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>

      <ToastContainer position="top-right" autoClose={2000} />
    </>
  );
}

export default App;
