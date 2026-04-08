import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import SellerNavbar from "../components/seller/SellerNavbar";
import SellerSidebar from "../components/seller/SellerSidebar";
import SellerProvider from "../context/SellerProvider";

//seller layout
const SellerLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isSidebarOpen]);

  //sidebar toggle
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  //sidebar close
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <SellerProvider>
      <div className="flex min-h-screen bg-slate-100">
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[100] lg:hidden"
            onClick={closeSidebar}
          />
        )}

        <div
          className={`
          ${isMobile ? "fixed" : "sticky"} 
          top-0 left-0 z-[110] h-screen
          transform transition-transform duration-300 ease-in-out
          ${isMobile && !isSidebarOpen ? "-translate-x-full" : "translate-x-0"}
        `}
        >
          <SellerSidebar
            isOpen={isSidebarOpen}
            isMobile={isMobile}
            onClose={closeSidebar}
            toggleSidebar={toggleSidebar}
          />
        </div>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <SellerNavbar
            isMobile={isMobile}
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
          />

          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SellerProvider>
  );
};

export default SellerLayout;
