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

const API_BASE = `${import.meta.env.VITE_API_URL}/seller`;

const formatDateForInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
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
  const [loading, setLoading] = useState(true);
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
    monthlyTarget: 0,
    achievementPct: 0,
    remainingTarget: 0,
  });

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
        axios.get(`${API_BASE}/profile/metrics`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

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

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

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

  const achievementPct = Number(metrics.achievementPct || 0);
  const achievementWidth = Math.min(100, Math.max(0, achievementPct));
  const dashboardCards = useMemo(
    () => [
      {
        title: "Total Records Handled",
        value: new Intl.NumberFormat("en-IN").format(
          Number(metrics.totalRecordsHandled || 0),
        ),
        icon: FileText,
      },
      {
        title: "This Month Sales",
        value: formatCurrency(metrics.thisMonthSales),
        icon: IndianRupee,
      },
      {
        title: "This Month Refund",
        value: formatCurrency(metrics.thisMonthRefund),
        icon: RefreshCcw,
      },
      {
        title: "Pending Followups",
        value: new Intl.NumberFormat("en-IN").format(
          Number(metrics.pendingFollowups || 0),
        ),
        icon: ListChecks,
      },
    ],
    [metrics],
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
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-white via-orange-50/40 to-amber-50/40 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-orange-900">
                Seller Profile
              </h2>
              <p className="text-sm text-orange-700">
                Manage personal details and performance targets
              </p>
            </div>
            <button
              type="button"
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </>
              ) : (
                <>
                  <PencilLine className="h-4 w-4" />
                  Edit Profile
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Full Name
              </span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="Enter full name"
                />
              </div>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={formData.email}
                  disabled
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-100 pl-10 pr-3 text-sm text-slate-500 outline-none"
                />
              </div>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone
              </span>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="Enter phone number"
                />
              </div>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Alternate Phone
              </span>
              <div className="relative">
                <PhoneCall className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="alternatePhone"
                  value={formData.alternatePhone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="Enter alternate phone"
                />
              </div>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date of Birth
              </span>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <DateField
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  disabled={!isEditing}
                  inputClassName="pl-10"
                />
              </div>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Monthly Target
              </span>
              <div className="relative">
                <Target className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  name="monthlyTarget"
                  value={formData.monthlyTarget}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100 disabled:text-slate-500"
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
                  fetchProfileData();
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
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="text-xl font-black tracking-tight text-slate-900">
            Performance Snapshot
          </h3>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map(({ title, value, icon: Icon }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-4 h-1.5 w-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400" />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {title}
                    </p>
                    <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
                  </div>
                  <span className="rounded-xl bg-slate-100 p-2 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
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
