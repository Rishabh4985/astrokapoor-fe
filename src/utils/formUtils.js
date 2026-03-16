import {
  parsePhoneNumberFromString,
  getCountryCallingCode,
} from "libphonenumber-js";
import disposableDomains from "disposable-email-domains";

export const countries = [];

export const getCountryCodeFromIso = (isoCode) => {
  try {
    if (!isoCode) return "";
    return `+${getCountryCallingCode(isoCode)}`;
  } catch {
    return "";
  }
};

export const stripCountryCode = (phone) => {
  if (!phone) return "";
  const parsed = parsePhoneNumberFromString(phone);
  return parsed ? parsed.nationalNumber : "";
};

export const detectPhoneIso = (phone, fallbackIso = "") => {
  if (!phone || !phone.startsWith("+")) return fallbackIso;

  for (const country of countries) {
    try {
      const callingCode = getCountryCallingCode(country.isoCode);
      if (phone.startsWith(`+${callingCode}`)) {
        return country.isoCode;
      }
    } catch {
      continue;
    }
  }
  return fallbackIso;
};

export const validateEmail = (email) => {
  if (!email) return true;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email)) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && !disposableDomains.includes(domain);
};

export const validateName = (value) => /^[a-zA-Z\s.'-]{2,}$/.test(value.trim());

export const validatePhone = (countryIso, number) => {
  if (!number) return true;
  if (!countryIso) return false;

  try {
    const callingCode = getCountryCallingCode(countryIso);
    const phone = parsePhoneNumberFromString(`+${callingCode}${number}`);
    return phone?.isValid() ?? false;
  } catch {
    return false;
  }
};

export const isValidCountry = (iso, availableCountries = []) => {
  return availableCountries.some((c) => c.isoCode === iso);
};

export const isValidState = (countryIso, stateName, availableStates = []) => {
  if (!stateName || !countryIso) return true;
  return availableStates.includes(stateName);
};

export const buildFullPhone = (countryIso, number) => {
  if (!countryIso || !number) return "";
  const callingCode = getCountryCallingCode(countryIso);
  return `+${callingCode}${number}`;
};

export const getAllCountries = () => countries;
