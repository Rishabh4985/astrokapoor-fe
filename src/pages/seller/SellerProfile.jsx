import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  UserRound,
  Phone,
  PhoneCall,
  CalendarDays,
  Mail,
  Target,
  Save,
  PencilLine,
  FileText,
  IndianRupee,
  RefreshCcw,
  ListChecks,
} from "lucide-react";
import DateField from "../../components/shared/DateField";
import { useAuth } from "../../context/AuthContext";
import SellerTimeFilter from "../../components/shared/SellerTimeFilter";


const API_BASE = `${import.meta.env.VITE_API_URL}/seller`;

const formatDateForInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const SellerProfile = () => {
  const { authToken, setCurrentSeller } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    dob: "",
    monthlyTarget: "0",
  });
  const [metrics, setMetrics] = useState({
    totalRecordsHandled: 0,
    thisMonthSales: 0,
    thisMonthRefund: 0,
    pendingFollowups: 0,
    pendingFollowupsAmount: 0,
    totalConvertedRecords: 0,
    totalConvertedAmount: 0,
    monthlyTarget: 0,
    achievementPct: 0,
    remainingTarget: 0,
    totalRefundedRecords: 0,
  });

  const[timeFilter, setTimeFilter] = useState("monthly");  

  const applyProfileToForm = useCallback((profile = {}) => {
    const fullName =
      profile.fullName ||
      `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

    setFormData({
      fullName,
      email: profile.email || "",
      phone: profile.phone || "",
      alternatePhone: profile.alternatePhone || "",
      dob: formatDateForInput(profile.dob),
      monthlyTarget: String(Number(profile.monthlyTarget || 0)),
    });
  }, []);

  const fetchProfileData = useCallback(async () => {
    if (!authToken) return;

    try {
      setLoading(true);
      const [profileRes, metricsRes] = await Promise.all([
        axios.get(`${API_BASE}/me`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        axios.get(`${API_BASE}/profile/metrics?filter=monthly`, { // Always load monthly for initial data
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      console.log("METRICS 👉", metricsRes.data); // 👈 ADD THIS LINE

      const profileData = profileRes.data || {};
      applyProfileToForm(profileData);
      setCurrentSeller?.(profileData);
      setMetrics((prev) => ({ ...prev, ...(metricsRes.data || {}) }));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [authToken, applyProfileToForm, setCurrentSeller]);

  const fetchMetricsOnly = useCallback(async () => {
    if (!authToken) return;

    try {
      const metricsRes = await axios.get(`${API_BASE}/profile/metrics`, {
  params: { filter: timeFilter },
  headers: { Authorization: `Bearer ${authToken}` },
});

      console.log("METRICS 👉", metricsRes.data);
      setMetrics((prev) => ({ ...prev, ...(metricsRes.data || {}) }));
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load metrics");
    }
  }, [authToken, timeFilter]);


  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]); // Only run on mount and when fetchProfileData changes

  useEffect(() => {
    if (timeFilter) {
      fetchMetricsOnly(); // Smooth filter changes without loading state
    }
  }, [timeFilter, fetchMetricsOnly]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const normalizedName = formData.fullName.trim().replace(/\s+/g, " ");
    const parsedTarget = Number(formData.monthlyTarget || 0);

    if (!normalizedName) {
      toast.error("Full name is required");
      return;
    }

    if (!Number.isFinite(parsedTarget) || parsedTarget < 0) {
      toast.error("Monthly target must be a valid positive number");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        fullName: normalizedName,
        phone: formData.phone.trim(),
        alternatePhone: formData.alternatePhone.trim(),
        dob: formData.dob || null,
        monthlyTarget: parsedTarget,
      };

      const profileRes = await axios.patch(`${API_BASE}/me`, payload, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const updatedProfile = profileRes.data || {};
      applyProfileToForm(updatedProfile);
      setCurrentSeller?.(updatedProfile);


const metricsRes = await axios.get(`${API_BASE}/profile/metrics`, {
  params: { filter: timeFilter },
  headers: { Authorization: `Bearer ${authToken}` },
});
      setMetrics((prev) => ({ ...prev, ...(metricsRes.data || {}) }));

      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const sellerInitials = useMemo(() => {
    const name = formData.fullName.trim();
    if (!name) return "US";
    const words = name.split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }, [formData.fullName]);

  const achievementPct = Number(metrics.achievementPct || 0);
  const achievementWidth = Math.min(100, Math.max(0, achievementPct));

  const pendingFollowupsAmount = Number(metrics.pendingFollowupsAmount || 0);
  const totalConvertedAmount = Number(metrics.totalConvertedAmount || 0);

  const dashboardCards = useMemo(
    () => [
      {
        title: "Total Records Handled",
        value: new Intl.NumberFormat("en-IN").format(Number(metrics.totalRecordsHandled || 0)),
        secondary: `↗ ${formatCurrency(metrics.thisMonthSales || 0)}`,
        icon: FileText,
        iconClass: "bg-emerald-100 text-emerald-700",
        dotClass: "bg-emerald-500",
      },
      {
        title: "Pending Followups",
        value: new Intl.NumberFormat("en-IN").format(Number(metrics.pendingFollowups || 0)),
        secondary: pendingFollowupsAmount > 0 ? `↗ ${formatCurrency(pendingFollowupsAmount)}` : undefined,
        icon: ListChecks,
        iconClass: "bg-amber-100 text-amber-700",
        dotClass: "bg-amber-500",
      },
      {
        title: "Total Converted Record",
        value: new Intl.NumberFormat("en-IN").format(Number(metrics.totalConvertedRecords || 0)),
        secondary: totalConvertedAmount > 0 ? `↗ ${formatCurrency(totalConvertedAmount)}` : undefined,
        icon: FileText,
        iconClass: "bg-violet-100 text-violet-700",
        dotClass: "bg-violet-500",
      },
      {
        title: "Total Refunded Record",
        value: new Intl.NumberFormat("en-IN").format(Number(metrics.totalRefundedRecords || 0)),
        secondary: `↘ ${formatCurrency(metrics.thisMonthRefund || 0)}`,
        icon: RefreshCcw,
        iconClass: "bg-rose-100 text-rose-700",
        dotClass: "bg-rose-500",
      },
    ],
    [metrics, pendingFollowupsAmount, totalConvertedAmount],
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1200px] rounded-2xl border border-slate-200 bg-white p-6 text-sm font-medium text-slate-500 shadow-sm">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5">
      <section className="overflow-hidden rounded-2xl border border-transparent bg-gradient-to-r from-[#b56324] via-[#d28235] to-[#f6b34a] shadow-[0_6px_16px_rgba(0,0,0,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5a86e] text-lg font-bold text-white">
              {sellerInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  {formData.fullName || "Seller Name"}
                </h2>
                <span className="rounded-full border border-white/40 bg-white/20 px-2 py-0.5 text-xs font-medium text-white">
                  Verified Seller
                </span>
              </div>
              <p className="text-sm text-white/80">
                Manage personal details and performance targets
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            disabled={saving}
            className="rounded-full border border-orange-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-orange-800 backdrop-blur-sm shadow-sm transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isEditing ? (saving ? "Saving..." : "Save Changes") : "Edit Profile"}
          </button>
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-orange-50/20 shadow-sm">
        <div className="space-y-5 p-4 sm:p-5">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide tracking-widest text-orange-900">
                Full Name
              </span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-900" />
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="h-10 w-full rounded-xl border border-orange-100 bg-orange-50/30 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-orange-50/40 disabled:text-slate-500"
                  placeholder="Enter full name"
                />
              </div>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide tracking-widest text-orange-900">
                Email
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-900" />
                <input
                  value={formData.email}
                  disabled
                  className="h-10 w-full rounded-xl border border-orange-100 bg-orange-50/30 pl-10 pr-3 text-sm text-slate-500 outline-none"
                />
              </div>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide tracking-widest text-orange-900">
                Phone
              </span>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-900" />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="h-10 w-full rounded-xl border border-orange-100 bg-orange-50/30 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-orange-50/40 disabled:text-slate-500"
                  placeholder="Enter phone number"
                />
              </div>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide tracking-widest text-orange-900">
                Alternate Phone
              </span>
              <div className="relative">
                <PhoneCall className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-900" />
                <input
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="h-10 w-full rounded-xl border border-orange-100 bg-orange-50/30 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-orange-50/40 disabled:text-slate-500"
                  placeholder="Enter alternate phone"
                />
              </div>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide tracking-widest text-orange-900">
                Date of Birth
              </span>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-orange-900" />
                <DateField
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  disabled={!isEditing}
                  inputClassName="h-10 w-full rounded-xl border border-orange-100 bg-orange-50/30 pl-10 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-orange-50/40 disabled:text-slate-500"
                />
              </div>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide tracking-widest text-orange-900">
                Monthly Target
              </span>
              <div className="relative">
                <Target className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-orange-900" />
                <input
                  type="number"
                  min="0"
                  name="monthlyTarget"
                  value={formData.monthlyTarget}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="h-10 w-full rounded-xl border border-orange-100 bg-orange-50/30 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-orange-50/40 disabled:text-slate-500"
                  placeholder="Enter monthly target"
                />
              </div>
            </label>
          </section>

          {isEditing && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  // No need to refetch data on cancel
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4 flex justify-between items-center">
  <h3 className="text-xl font-black tracking-tight text-slate-900">
    Performance Snapshot
  </h3>

  <SellerTimeFilter 
    value={timeFilter} 
    onChange={setTimeFilter} 
  />
</div>

        <div className="space-y-5 p-4 sm:p-5">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map(({ title, value, secondary, icon, iconClass }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-start">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${iconClass}`}>
                    {React.createElement(icon, { className: "h-4 w-4" })}
                  </span>
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  {title}
                </p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
                  {value}
                </p>

                {secondary && (
                  <p className="mt-2 flex items-center text-sm font-medium text-slate-600">
                    <span className="mr-2 text-green-600">{secondary}</span>
                  </p>
                )}
              </article>
            ))}
          </section>

          <section className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-amber-50 to-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-lg font-bold text-orange-900">Target Achievement</h4>
              <span className="text-sm font-semibold text-orange-700">
                {achievementPct.toFixed(2)}%
              </span>
            </div>

            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-orange-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                style={{ width: `${achievementWidth}%` }}
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-3">
              <p>
                Achieved:{" "}
                <span className="font-semibold text-slate-800">
                  {formatCurrency(metrics.thisMonthSales)}
                </span>
              </p>
              <p>
                Target:{" "}
                <span className="font-semibold text-slate-800">
                  {formatCurrency(metrics.monthlyTarget)}
                </span>
              </p>
              <p>
                Remaining:{" "}
                <span className="font-semibold text-slate-800">
                  {formatCurrency(metrics.remainingTarget)}
                </span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
export default SellerProfile;
