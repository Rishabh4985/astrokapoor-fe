import React, { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Search,
  PlusSquare,
  User,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const SellerSidebar = ({ isMobile, onClose }) => {
  const location = useLocation();
  const { currentSeller } = useAuth();

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

  const sellerInitial = sellerDisplayName.charAt(0).toUpperCase();

  const menuItems = [
    { to: "/seller/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/seller/records", label: "My Sales Record", icon: FileText },
    { to: "/seller/saleslookup", label: "Sales Lookup", icon: Search },
    { to: "/seller/addrecord", label: "Add Record", icon: PlusSquare },
    { to: "/seller/profile", label: "Profile", icon: User },
  ];

  const navLinkStyles = ({ isActive }) =>
    `group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
      isActive
        ? "bg-white text-orange-900 shadow-md"
        : "text-orange-100/95 hover:bg-white/10 hover:text-white"
    }`;

  const handleNavClick = (e) => {
    const targetPath = e.currentTarget.getAttribute("href");
    if (isMobile && targetPath !== location.pathname) {
      setTimeout(() => onClose?.(), 150);
    }
  };

  return (
    <aside
      className={`
        relative h-full overflow-hidden border-r border-orange-300/30
         bg-gradient-to-b from-stone-950 via-orange-950 to-amber-800
        text-white shadow-2xl
        ${isMobile ? "w-80 max-w-[86vw]" : "w-72"}
      `}
    >

      <div className="pointer-events-none absolute -left-20 -top-16 h-44 w-44 rounded-full bg-orange-300/25 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-44 w-44 rounded-full bg-amber-200/20 blur-2xl" />
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full border border-white/45 bg-white/25 font-black shadow-inner">
              {sellerInitial}
            </div>
            <div>
              <p
                className="max-w-[11.5rem] truncate text-2xl font-extrabold leading-none tracking-tight text-white"
                title={sellerDisplayName}
              >
                {sellerDisplayName}'s
              </p>
              <p className="text-xs text-orange-100/90">Performance Panel</p>
            </div>
          </div>

          {isMobile && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-orange-100 hover:bg-white/10"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="px-4 pb-3">
          <NavLink
            to="/seller/addrecord"
            onClick={handleNavClick}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-semibold text-orange-900 shadow-md ring-1 ring-white/80 transition hover:bg-orange-50"
          >
            <Sparkles className="h-4 w-4" />
            New Record
          </NavLink>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={navLinkStyles}
                onClick={handleNavClick}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </span>
                <ChevronRight className="h-4 w-4 opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/20 p-4">
          <div className="rounded-xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-xs font-semibold text-orange-50">
              {sellerDisplayName} Workspace
            </p>
            <p className="mt-1 text-[11px] text-orange-100/85">
              Built for quick record ops and follow-ups.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SellerSidebar;
