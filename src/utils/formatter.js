export const nonCapitalizedFields = ["email1", "email2", "handlerId"];

/* ============================= */
/* Capitalize */
/* ============================= */
export const capitalizeValue = (value) => {
  if (!value || typeof value !== "string") return value;

  return value
    .toLowerCase()
    .split(" ")
    .map((word) =>
      word ? word.charAt(0).toUpperCase() + word.slice(1) : "",
    )
    .join(" ");
};

/* ============================= */
/* Date Formatting */
/* ============================= */
export const formatDate = (value) => {
  if (!value) return "-";

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleDateString("en-GB");
  }

  if (value instanceof Date) {
    return value.toLocaleDateString("en-GB");
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  return value;
};

/* ============================= */
/* Currency Formatting (Safe) */
/* ============================= */
export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "")
    return "₹0.00";

  const number = Number(value);

  if (!Number.isFinite(number)) return `₹${value}`;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};

/* ============================= */
/* Master Formatter */
/* ============================= */
export const formatValue = (key, value) => {
  if (value === null || value === undefined || value === "")
    return "-";

  if (typeof value === "object") {
    if (value?.label) return value.label;
    return formatDate(value);
  }

  const lowerKey = key.toLowerCase();

  if (lowerKey.includes("date")) {
    return formatDate(value);
  }

  if (
    lowerKey.includes("amount") ||
    lowerKey.includes("refund") ||
    lowerKey.includes("pending")
  ) {
    return formatCurrency(value);
  }

  if (
    typeof value === "string" &&
    value.length < 100 &&
    !nonCapitalizedFields.includes(key)
  ) {
    return capitalizeValue(value);
  }

  return String(value);
};