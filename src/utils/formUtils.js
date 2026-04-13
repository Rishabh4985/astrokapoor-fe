import {
  parsePhoneNumberFromString,
  getCountryCallingCode,
} from "libphonenumber-js";
import disposableDomains from "disposable-email-domains";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_REGEX = /^[a-zA-Z./()'\s]{2,}$/;
const normalizeIso = (iso = "") => iso.toString().trim().toUpperCase();
const normalizePhoneDigits = (value) =>
  value === undefined || value === null
    ? ""
    : value.toString().replace(/\D/g, "");

export const stripCountryCode = (phone) => {
  if (!phone) return "";
  const raw = phone.toString().trim();
  const parsed = parsePhoneNumberFromString(raw);
  if (parsed?.nationalNumber) return parsed.nationalNumber;

  // Fallback: keep meaningful digits instead of returning empty.
  const digits = normalizePhoneDigits(raw);
  if (digits) return digits;
  return raw;
};

export const detectPhoneIso = (phone, fallbackIso = "") => {
  const fallback = normalizeIso(fallbackIso);
  if (!phone) return fallback;

  const raw = phone.toString().trim();
  if (!raw) return fallback;

  const parsedDirect = parsePhoneNumberFromString(raw);
  if (parsedDirect?.country) return parsedDirect.country;

  if (!fallback) return "";

  const parsedWithFallback = parsePhoneNumberFromString(raw, fallback);
  if (parsedWithFallback?.country) return parsedWithFallback.country;

  const digits = normalizePhoneDigits(raw);
  if (!digits) return fallback;

  try {
    const callingCode = getCountryCallingCode(fallback);
    const nationalDigits = digits.startsWith(callingCode)
      ? digits.slice(callingCode.length)
      : digits;
    const rebuilt = `+${callingCode}${nationalDigits}`;
    const parsedRebuilt = parsePhoneNumberFromString(rebuilt);
    if (parsedRebuilt?.country) return parsedRebuilt.country;
  } catch {
    return fallback;
  }

  return fallback;
};

export const validateEmail = (email) => {
  if (!email) return true;

  const normalized = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalized)) return false;

  const domain = normalized.split("@")[1];
  return !disposableDomains.includes(domain);
};

export const validateName = (value) => {
  if (typeof value !== "string") return false;
  return NAME_REGEX.test(value.trim());
};

export const validatePhone = (countryIso, number) => {
  if (!number) return true;
  if (!countryIso) return false;

  try {
    const normalizedIso = normalizeIso(countryIso);
    const digits = normalizePhoneDigits(number);
    if (!digits) return false;

    const callingCode = getCountryCallingCode(normalizedIso);
    const nationalDigits = digits.startsWith(callingCode)
      ? digits.slice(callingCode.length)
      : digits;
    const phone = parsePhoneNumberFromString(`+${callingCode}${nationalDigits}`);
    return phone && phone.isValid();
  } catch {
    return false;
  }
};

export const buildFullPhone = (countryIso, number) => {
  if (!countryIso || !number) return "";
  const normalizedIso = normalizeIso(countryIso);
  const raw = number.toString().trim();
  const digits = normalizePhoneDigits(raw);
  if (!digits) return "";

  // If we already received a valid international number, keep canonical E.164.
  const parsedDirect = raw.startsWith("+") ? parsePhoneNumberFromString(raw) : null;
  if (parsedDirect?.isValid()) {
    return parsedDirect.number;
  }

  try {
    const callingCode = getCountryCallingCode(normalizedIso);
    const nationalDigits = digits.startsWith(callingCode)
      ? digits.slice(callingCode.length)
      : digits;
    const candidate = `+${callingCode}${nationalDigits}`;
    const parsed = parsePhoneNumberFromString(candidate);
    return parsed?.isValid() ? parsed.number : candidate;
  } catch {
    return "";
  }
};
