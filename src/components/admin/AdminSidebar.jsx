import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  User,
  Search,
  PlusCircle,
  ChevronLeft,
} from "lucide-react";

//Sidebar
const AdminSidebar = ({ isMobile, onClose }) => {
  const location = useLocation();

  //Navlinks
  const navLinkStyles = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
      isActive
        ? "bg-orange-200 text-orange-800 shadow-sm"
        : "text-orange-700 hover:bg-orange-100 hover:text-orange-800"
    }`;

  const handleNavClick = (e) => {
    const targetPath = e.currentTarget.getAttribute("href");
    if (isMobile && targetPath !== location.pathname) {
      setTimeout(() => onClose?.(), 150);
    }
  };

  return (
    <div
      className={`
        h-full bg-orange-50 border-r border-orange-200 shadow-lg
        transition-all duration-300 ease-in-out
        ${isMobile ? "w-80 max-w-[85vw]" : "w-64"}
        overflow-hidden flex flex-col
      `}
    >
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-orange-200 bg-gradient-to-r from-orange-100 to-orange-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <LayoutDashboard size={16} className="text-white" />
          </div>
          <div className="font-bold text-orange-800">
            <div className="text-lg">Admin</div>
            <div className="text-xs text-orange-600 -mt-1">Panel</div>
          </div>
        </div>

        {isMobile && (
          <button
            onClick={onClose}
            className="text-orange-600 p-1.5 rounded-full hover:bg-orange-200 transition-colors"
            aria-label="Close sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Navigation section */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <NavLink
          to="/admin/dashboard"
          className={navLinkStyles}
          onClick={handleNavClick}
        >
          <LayoutDashboard size={20} className="flex-shrink-0" />
          <span className="truncate">Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/sales-records"
          className={navLinkStyles}
          onClick={handleNavClick}
        >
          <FileText size={20} className="flex-shrink-0" />
          <span className="truncate">Sales Records</span>
        </NavLink>

        <NavLink
          to="/admin/sales-lookup"
          className={navLinkStyles}
          onClick={handleNavClick}
        >
          <Search size={20} className="flex-shrink-0" />
          <span className="truncate">Sales Lookup</span>
        </NavLink>

        <NavLink
          to="/admin/add-record"
          className={navLinkStyles}
          onClick={handleNavClick}
        >
          <PlusCircle size={20} className="flex-shrink-0" />
          <span className="truncate">Add Record</span>
        </NavLink>

        <NavLink
          to="/admin/profile"
          className={navLinkStyles}
          onClick={handleNavClick}
        >
          <User size={20} className="flex-shrink-0" />
          <span className="truncate">Profile</span>
        </NavLink>

        {/* Management section */}
        <div className="pt-4 mt-4 border-t border-orange-200">
          <div className="px-4 py-2 text-xs font-medium text-orange-600 uppercase tracking-wider">
            Management
          </div>

          <NavLink
            to="/admin/manage-salesperson"
            className={navLinkStyles}
            onClick={handleNavClick}
          >
            <User size={20} className="flex-shrink-0" />
            <span className="truncate">Manage Salesperson</span>
          </NavLink>
        </div>
      </nav>

      {/*  Footer section */}
      <div className="p-4 border-t border-orange-200 bg-orange-25">
        <div className="flex items-center gap-3 text-sm text-orange-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>System Active</span>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
