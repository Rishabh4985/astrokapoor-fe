import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Menu, X, Search, Bell, ChevronDown } from "lucide-react";
import { SellerContext } from "../../context/SellerContext";
import { debounce } from "../../utils/debounce";
import { useAuth } from "../../context/AuthContext";

const SellerNavbar = ({ isMobile, isSidebarOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const { currentSeller, logout } = useAuth();
  const { filters = {}, setFilters, goToPage } = useContext(SellerContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.query || "");
  const dropdownRef = useRef(null);
  const debouncedSearchRef = useRef(
    debounce((searchQuery) => {
      setFilters?.((prev = {}) => ({ ...prev, query: searchQuery }));
      goToPage?.(1);
    }, 500),
  );

  const sellerDisplayName = useMemo(() => {
    const fullNameFromParts = [
      currentSeller?.firstName,
      currentSeller?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const fallbackName =
      currentSeller?.name ||
      currentSeller?.fullName ||
      (currentSeller?.email ? currentSeller.email.split("@")[0] : "");

    return fullNameFromParts || fallbackName || "Seller";
  }, [currentSeller]);

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const incomingQuery = filters.query || "";
    setSearchInput(incomingQuery);
  }, [filters.query]);

  useEffect(() => {
    const debouncedSearch = debouncedSearchRef.current;
    return () => debouncedSearch.cancel?.();
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearchRef.current(value);
  };

  return (
    <nav className="sticky top-0 z-30 border-b border-white/10 bg-gradient-to-r from-stone-950 via-orange-950 to-amber-800 px-3 py-3 shadow-lg sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="rounded-lg border border-white/25 p-2 text-orange-50 transition hover:bg-white/10"
              aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <div className="text-3xl font-black tracking-tight text-white">
            Astro<span className="text-amber-300">Kapoor</span>
          </div>
        </div>

        <div className="hidden min-w-[260px] flex-1 max-w-md md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-100/80" />
            <input
              value={searchInput}
              onChange={handleSearchChange}
              onBlur={() => debouncedSearchRef.current.flush?.()}
              placeholder="Search records..."
              className="w-full rounded-xl border border-white/25 bg-white/10 py-2 pl-10 pr-3 text-sm text-orange-50 placeholder-orange-100/80 outline-none transition focus:border-amber-300/60 focus:bg-white/15"
            />
          </div>
        </div>

        <div className="flex items-center gap-2" ref={dropdownRef}>
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-white/10 text-orange-50 transition hover:bg-white/15"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 rounded-full bg-orange-500 px-1.5 text-[10px] font-semibold text-white">
              1
            </span>
          </button>

          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-white/15"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <User className="h-4 w-4" />
            <span className="hidden max-w-[10rem] truncate sm:inline" title={sellerDisplayName}>
              {sellerDisplayName}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-12 z-40 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <button
                onClick={() => {
                  navigate("/seller/profile");
                  setDropdownOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <User className="h-4 w-4 text-orange-600" />
                Manage Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default SellerNavbar;
