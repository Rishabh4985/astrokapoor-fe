import { useCallback, useEffect, useMemo, useState } from "react";
import OptionsContext from "./OptionsContext";

const defaultDropdowns = {
  service: [],
  mode: [],
  category: [],
  status: [],
  overallRating: [],
  country: [],
  state: {},
  expert: [],
  handleBy: [],
  gems: [],
  gems1: [],
  gems2: [],
  gems3: [],
  gems4: [],
};

const normalizeCountryOptions = (countryOptions) => {
  if (!Array.isArray(countryOptions)) return [];

  return countryOptions.map((countryItem) => ({
    name: countryItem?.name || "",
    isoCode: countryItem?.isoCode || countryItem?.iso2 || "",
    phoneCode: countryItem?.phoneCode || countryItem?.phonecode || "",
  }));
};

const OptionsProvider = ({ children }) => {
  const [dropdowns, setDropdowns] = useState(defaultDropdowns);
  const [requiredFields, setRequiredFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOptions = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);

      const API_BASE = import.meta.env.VITE_API_URL;
      if (!API_BASE) {
        throw new Error("API URL is not configured");
      }

      const res = await fetch(`${API_BASE}/options`, { signal });
      let data = null;

      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch options");
      }

      const { requiredFields: reqFields, state, country, ...rest } = data || {};

      setDropdowns({
        ...defaultDropdowns,
        ...rest,
        country: normalizeCountryOptions(country),
        state: state && typeof state === "object" ? state : {},
      });
      setRequiredFields(Array.isArray(reqFields) ? reqFields : []);
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }
      console.error("Options fetch error:", err);
      setError(err?.message || "Failed to fetch options");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchOptions(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchOptions]);

  const refetchOptions = useCallback(async () => {
    await fetchOptions();
  }, [fetchOptions]);

  const getStatesByCountry = useCallback((countryIso) => {
    if (!dropdowns.state || !countryIso) return [];
    return dropdowns.state[countryIso] || [];
  }, [dropdowns.state]);

  const value = useMemo(
    () => ({
      dropdowns,
      requiredFields,
      loading,
      error,
      getStatesByCountry,
      refetchOptions,
    }),
    [dropdowns, requiredFields, loading, error, getStatesByCountry, refetchOptions],
  );

  return (
    <OptionsContext.Provider value={value}>
      {children}
    </OptionsContext.Provider>
  );
};

export default OptionsProvider;
