import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Search,
  PlusSquare,
  User,
} from "lucide-react";

//sidebar
const SellerSidebar = ({ isCollapsed }) => {
  const iconSize = isCollapsed ? 24 : 20;

  const navLinkStyles = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-200 group ${
      isActive
        ? "bg-orange-200 text-orange-900 font-semibold"
        : "text-orange-700 hover:bg-orange-100"
    }`;

  return (
    <div
      className={`h-screen bg-orange-50 border-r border-orange-200 shadow-sm transition-all duration-300 overflow-x-hidden ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-center md:justify-start p-5">
        {!isCollapsed && (
          <div className="text-xl sm:text-2xl font-bold text-orange-800">
            Seller<span className="text-orange-500 ml-2">Panel</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-3 mt-2 px-2">
        <NavLink to="/seller/seller-dashboard" className={navLinkStyles}>
          <LayoutDashboard size={iconSize} />
          {!isCollapsed && <span>Dashboard</span>}
        </NavLink>

        <NavLink to="/seller/seller-records" className={navLinkStyles}>
          <FileText size={iconSize} />
          {!isCollapsed && <span>My Sales Record</span>}
        </NavLink>

        <NavLink to="/seller/seller-saleslookup" className={navLinkStyles}>
          <Search size={iconSize} />
          {!isCollapsed && <span>Sales Lookup</span>}
        </NavLink>

        <NavLink to="/seller/seller-addrecord" className={navLinkStyles}>
          <PlusSquare size={iconSize} />
          {!isCollapsed && <span>Add Record</span>}
        </NavLink>

        <NavLink to="/seller/seller-profile" className={navLinkStyles}>
          <User size={iconSize} />
          {!isCollapsed && <span>Profile</span>}
        </NavLink>
      </nav>
    </div>
  );
};

export default SellerSidebar;
