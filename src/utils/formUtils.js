import {
  parsePhoneNumberFromString,
  getCountryCallingCode,
} from "libphonenumber-js";
import disposableDomains from "disposable-email-domains";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_REGEX = /^[a-zA-Z.\s]{2,}$/;

export const stripCountryCode = (phone) => {
  if (!phone) return "";
  const parsed = parsePhoneNumberFromString(phone);
  return parsed ? parsed.nationalNumber : "";
};

export const detectPhoneIso = (phone, fallbackIso = "") => {
  return fallbackIso;
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
    const callingCode = getCountryCallingCode(countryIso);
    const phone = parsePhoneNumberFromString(`+${callingCode}${number}`);
    return phone && phone.isValid();
  } catch {
    return false;
  }
};

export const buildFullPhone = (countryIso, number) => {
  if (!countryIso || !number) return "";
  const callingCode = getCountryCallingCode(countryIso);
  return `+${callingCode}${number}`;
};
