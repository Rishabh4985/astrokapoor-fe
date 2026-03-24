import { Routes, Route, Navigate } from "react-router-dom";
import SellerDashboard from "../pages/seller/SellerDashboard";
import SellerProfile from "../pages/seller/SellerProfile";
import SellerLayout from "../layouts/SellerLayout";
import SellerRecordList from "../pages/seller/SellerRecordList";
import SellerAddRecord from "../pages/seller/SellerAddRecord";
import SellerSalesLookup from "../pages/seller/SellerSalesLookup";
import { useAuth } from "../context/AuthContext";

const SellerRoutes = () => {
  const { userRole } = useAuth();

  if (userRole !== "seller") {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route element={<SellerLayout />}>
        <Route index element={<SellerDashboard />} />
        <Route path="dashboard" element={<SellerDashboard />} />
        <Route path="profile" element={<SellerProfile />} />
        <Route path="records" element={<SellerRecordList />} />
        <Route path="addrecord" element={<SellerAddRecord />} />
        <Route path="saleslookup" element={<SellerSalesLookup />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default SellerRoutes;
