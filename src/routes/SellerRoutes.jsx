import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SellerDashboard from "../pages/seller/SellerDashboard";
import SellerProfile from "../pages/seller/SellerProfile";
import SellerLayout from "../layouts/SellerLayout";
import SellerRecordList from "../pages/seller/SellerRecordList";
import SellerAddRecord from "../pages/seller/SellerAddRecord";
import SellerProvider from "../context/SellerProvider";
import SellerSalesLookup from "../pages/seller/SellerSalesLookup";
const isSellerLoggedIn = () => {
  return localStorage.getItem("isSellerLoggedIn") === "true";
};

const SellerRoutes = () => {
  if (!isSellerLoggedIn()) {
    return <Navigate to="/" replace />;
  }

  return (
    <SellerProvider>
      <Routes>
        <Route path="/" element={<SellerLayout />}>
          <Route index element={<SellerDashboard />} />
          <Route path="seller-dashboard" element={<SellerDashboard />} />
          <Route path="seller-profile" element={<SellerProfile />} />
          <Route path="seller-records" element={<SellerRecordList />} />
          <Route path="seller-addrecord" element={<SellerAddRecord />} />
          <Route path="seller-saleslookup" element={<SellerSalesLookup />} />
        </Route>
      </Routes>
    </SellerProvider>
  );
};

export default SellerRoutes;
