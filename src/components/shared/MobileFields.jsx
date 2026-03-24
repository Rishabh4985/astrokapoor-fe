import React, { useContext } from "react";
import OptionsContext from "../../context/OptionsContext";

const MobileFields = ({
  name,
  label,
  value,
  countryIso,
  required,
  onChange,
  onCountryChange,
}) => {
  const { dropdowns } = useContext(OptionsContext);
  const isCountrySelected = !!countryIso;

  const formatCountryCodeLabel = (country) => {
    const iso = (country?.isoCode || "").toUpperCase();
    const rawPhone = (country?.phoneCode || "").toString().trim();
    const phone = rawPhone ? `+${rawPhone.replace(/^\+/, "")}` : "";

    if (phone && iso) return `${phone} ${iso}`;
    if (phone) return phone;
    if (iso) return iso;
    return country?.name || "";
  };

  return (
    <div className="flex flex-col">
      <div className="mb-1 flex items-center gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {!isCountrySelected && (
          <span className="whitespace-nowrap rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            Select country first
          </span>
        )}
      </div>

      <div className="flex w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <select
          value={
            dropdowns.country?.find((c) => c.isoCode === countryIso)?.name || ""
          }
          onChange={(e) => onCountryChange(e, name)}
          className="h-10 w-[92px] shrink-0 border-r border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-700 outline-none sm:w-[108px]"
        >
          <option value="">Code</option>
          {dropdowns.country?.map((c) => (
            <option key={c.isoCode} value={c.name}>
              {formatCountryCodeLabel(c)}
            </option>
          ))}
        </select>

        <input
          name={name}
          value={value}
          onChange={onChange}
          type="tel"
          disabled={!isCountrySelected}
          className="h-10 flex-1 bg-white px-3 text-sm text-slate-700 outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </div>
    </div>
  );
};

export default MobileFields;
