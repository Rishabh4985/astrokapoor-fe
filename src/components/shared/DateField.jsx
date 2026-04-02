import React, { useRef } from "react";
import { CalendarDays } from "lucide-react";

const DateField = ({
  type = "date",
  className = "",
  inputClassName = "",
  iconClassName = "",
  disabled = false,
  ...props
}) => {
  const inputRef = useRef(null);

  const openPicker = (event) => {
    event.preventDefault();
    if (disabled) return;

    const input = inputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
  };

  return (
    <div
      className={`group relative h-10 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 ${
        disabled ? "bg-slate-100" : ""
      } ${className}`}
    >
      <input
        ref={inputRef}
        type={type}
        disabled={disabled}
        className={`modern-date-input h-full w-full rounded-xl border-0 bg-transparent px-3 pr-10 text-sm text-slate-700 outline-none disabled:cursor-not-allowed disabled:text-slate-400 ${inputClassName}`}
        {...props}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        tabIndex={-1}
        aria-label={`Open ${type} picker`}
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-orange-50 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CalendarDays className={`h-4 w-4 ${iconClassName}`} />
      </button>
    </div>
  );
};

export default DateField;
