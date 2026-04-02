import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminProvider from "../context/AdminProvider";
import AdminNavbar from "../components/admin/AdminNavbar";
import { Outlet } from "react-router-dom";

//Layout
const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);

      if (!mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [isSidebarOpen]);

  //Toggle Sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  //Close Sidebar
  const closeSidebar = () => {
    if (isMobile && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <AdminProvider>
      <div className="flex min-h-screen bg-slate-100">
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 z-[100] bg-black bg-opacity-50 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        <div
          className={`
            ${isMobile ? "fixed" : "sticky"} 
            left-0 top-0 z-[110] h-screen
            transform transition-transform duration-300 ease-in-out
            ${
              isMobile && !isSidebarOpen ? "-translate-x-full" : "translate-x-0"
            }
          `}
        >
          <AdminSidebar
            isOpen={isSidebarOpen}
            isMobile={isMobile}
            onClose={closeSidebar}
          />
        </div>

        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <AdminNavbar
            onToggleSidebar={toggleSidebar}
            isMobile={isMobile}
            isSidebarOpen={isSidebarOpen}
          />

          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminProvider>
  );
};

export default AdminLayout;
