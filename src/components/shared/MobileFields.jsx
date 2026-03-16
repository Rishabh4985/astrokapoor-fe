import React, { useContext } from "react";
import OptionsContext from "../../context/OptionsContext";
import { getCountryCodeFromIso } from "../../utils/formUtils";

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

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <label className="text-sm text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {!isCountrySelected && (
          <span className="text-xs text-amber-600 font-medium whitespace-nowrap">
            Select country first
          </span>
        )}
      </div>

      <div className="flex w-full rounded-lg border border-gray-300 overflow-hidden">
        <select
          value={
            dropdowns.country?.find((c) => c.isoCode === countryIso)?.name || ""
          }
          onChange={(e) => onCountryChange(e, name)}
          className="bg-gray-100 text-sm px-1 outline-none border-r border-gray-300 max-w-[120px]"
        >
          <option value="">Country</option>
          {dropdowns.country?.map((c) => (
            <option key={c.isoCode} value={c.name}>
              {c.isoCode} {getCountryCodeFromIso(c.isoCode)}
            </option>
          ))}
        </select>

        <input
          name={name}
          value={value}
          onChange={onChange}
          type="tel"
          disabled={!isCountrySelected}
          className="flex-1 px-3 py-2 text-sm outline-none"
        />
      </div>
    </div>
  );
};

export default MobileFields;
