import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Menu, X } from "lucide-react";

//seller navbar
const SellerNavbar = ({ isMobile, isSidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  //logout
  const handleLogout = () => {
    localStorage.removeItem("isSellerLoggedIn");
    localStorage.removeItem("role");
    localStorage.removeItem("sellerId");
    sessionStorage.removeItem("sellerRecords");
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white shadow-sm border-b border-orange-200 px-3 sm:px-6 py-4 flex items-center justify-between h-16 sm:h-20 sticky top-0 z-20">
      {/* Left section with menu toggle and brand */}
      <div className="flex items-center gap-3 sm:gap-4">
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-orange-700 hover:bg-orange-100 active:bg-orange-200 transition-colors touch-manipulation"
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}

        <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-800">
          Astro<span className="text-orange-500">Kapoor</span>
        </div>
      </div>

      {/* Right section with user dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-sm text-sm sm:text-base min-h-[44px] flex items-center gap-2 touch-manipulation"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Seller</span>
          <svg
            className={`w-4 h-4 transition-transform ${
              dropdownOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 max-w-[90vw] bg-white border border-orange-200 rounded-lg shadow-lg z-30 overflow-hidden">
            <div className="py-1">
              <button
                onClick={() => {
                  navigate("/seller/seller-profile");
                  setDropdownOpen(false);
                }}
                className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 transition-colors touch-manipulation"
              >
                <User className="w-4 h-4 text-orange-600" />
                <span>Manage Profile</span>
              </button>

              <div className="border-t border-orange-100"></div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors touch-manipulation"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default SellerNavbar;
