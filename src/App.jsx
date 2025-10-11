import { Routes, Route, Navigate } from "react-router-dom";
import AdminRoutes from "./routes/AdminRoutes";
import SellerRoutes from "./routes/SellerRoutes";
import Login from "./pages/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminForgotPassword from "./pages/admin/AdminForgotPassword";
import AdminVerifyOtp from "./pages/admin/AdminVerifyOtp";
import { useAuth } from "./context/AuthContext";
import AdminProvider from "./context/AdminProvider";
import SellerProvider from "./context/SellerProvider";

function App() {
  const { userRole } = useAuth();
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/admin/forgot-password"
          element={<AdminForgotPassword />}
        />
        <Route path="/admin/verify-otp" element={<AdminVerifyOtp />} />

        {userRole === "admin" && (
          <Route
            path="/admin/*"
            element={
              <AdminProvider>
                <AdminRoutes />
              </AdminProvider>
            }
          />
        )}

        {userRole === "seller" && (
          <Route
            path="/seller/*"
            element={
              <SellerProvider>
                <SellerRoutes />
              </SellerProvider>
            }
          />
        )}

        <Route
          path="*"
          element={
            userRole === "admin" ? (
              <Navigate to="/admin" replace />
            ) : userRole === "seller" ? (
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
