export const nonCapitalizedFields = ["email1", "email2", "handlerId"];

/* ============================= */
/* Capitalize */
/* ============================= */
export const capitalizeValue = (value) => {
  if (typeof value !== "string") return value;

  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
};

/* ============================= */
/* Date Formatting */
/* ============================= */
export const formatDate = (value) => {
  if (!value) return "-";

  const pad2 = (num) => String(num).padStart(2, "0");

  const isValidDateParts = (year, month, day) => {
    const candidate = new Date(year, month - 1, day);
    return (
      !Number.isNaN(candidate.getTime()) &&
      candidate.getFullYear() === year &&
      candidate.getMonth() === month - 1 &&
      candidate.getDate() === day
    );
  };

  const formatDateObject = (date) =>
    `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;

  if (typeof value === "string") {
    const trimmed = value.trim();

    const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmyMatch) {
      const day = Number(dmyMatch[1]);
      const month = Number(dmyMatch[2]);
      const year = Number(dmyMatch[3]);
      if (isValidDateParts(year, month, day)) {
        return `${pad2(day)}/${pad2(month)}/${year}`;
      }
    }

    const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (ymdMatch) {
      const year = Number(ymdMatch[1]);
      const month = Number(ymdMatch[2]);
      const day = Number(ymdMatch[3]);
      if (isValidDateParts(year, month, day)) {
        return `${pad2(day)}/${pad2(month)}/${year}`;
      }
    }
  }

  let date;

  if (value?.seconds) {
    date = new Date(value.seconds * 1000);
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number") {
    date = new Date(value);
  } else if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  }

  return date ? formatDateObject(date) : value;
};

/* ============================= */
/* Currency Formatting (Safe) */
/* ============================= */
export const formatCurrency = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) return "-";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(number);
};

/* ============================= */
/* Master Formatter */
/* ============================= */
export const formatValue = (key, value) => {
  if (value === null || value === undefined || value === "") return "-";

  if (typeof value === "object") {
    if (value?.label) return value.label;
    if (Array.isArray(value)) {
      // Handle service array specifically
      if (key.toLowerCase() === "service") {
        return value.length > 0 ? value.join(", ") : "-";
      }
      // Handle other arrays
      return value.join(", ");
    }
    return formatDate(value);
  }

  const lowerKey = (key || "").toLowerCase();

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
