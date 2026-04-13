import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProfile from "../pages/admin/AdminProfile";
import AdminSalesLookup from "../pages/admin/AdminSalesLookup";
import AdminSalesRecordList from "../pages/admin/AdminSalesRecordList";
import AdminLayout from "../layouts/AdminLayout";
import AdminAddRecord from "../pages/admin/AdminAddRecord";
import ManageSalesPerson from "../pages/admin/ManageSalesPerson";
import AdminSalesOverview from "../pages/admin/AdminSalesOverview";

const AdminRoutes = () => {
  const { userRole, isAuthenticated } = useAuth();

  if (!isAuthenticated || userRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="sales-records" element={<AdminSalesRecordList />} />
        <Route path="sales-lookup" element={<AdminSalesLookup />} />
        <Route path="add-record" element={<AdminAddRecord />} />
        <Route path="manage-salesperson" element={<ManageSalesPerson />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
        <Route path="sales-overview" element={<AdminSalesOverview />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
