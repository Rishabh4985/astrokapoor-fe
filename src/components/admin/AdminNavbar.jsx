import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const AdminNavbar = ({ onToggleSidebar, isMobile, isSidebarOpen = false }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  //Logout
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  const handleNavigation = (path) => {
    navigate(path);
    setDropdownOpen(false);
  };

  return (
    <nav className="bg-orange-100 shadow px-2 sm:px-4 py-3 flex items-center justify-between h-16 sm:h-20 sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {isMobile && (
          <button
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="text-orange-700 p-2 rounded-md hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        <div className="font-bold text-orange-800 truncate">
          <span className="text-lg sm:text-xl lg:text-2xl">
            Astro<span className="text-orange-500">Kapoor</span>
          </span>
        </div>
      </div>

      <div className="relative ml-auto" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          className="flex items-center gap-1 bg-orange-700 text-white text-sm sm:text-base px-3 sm:px-4 py-2 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 transition-colors"
        >
          <span className="hidden xs:inline sm:inline">Admin</span>
          <User size={16} className="xs:hidden sm:hidden" />
          <span className="hidden sm:inline">▼</span>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 min-w-[10rem] sm:min-w-[12rem] bg-white border border-stone-200 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="py-1">
              <button
                onClick={() => handleNavigation("/admin/manage-salesperson")}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm sm:text-base text-stone-700 hover:bg-orange-100 focus:bg-orange-100 transition-colors"
              >
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Manage Salesperson</span>
              </button>

              <hr className="border-gray-200" />

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm sm:text-base text-red-600 hover:bg-red-50 focus:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AdminNavbar;
