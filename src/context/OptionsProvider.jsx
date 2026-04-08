import { useEffect, useState } from "react";
import OptionsContext from "./OptionsContext";

const OptionsProvider = ({ children }) => {
  const [dropdowns, setDropdowns] = useState({
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
  });

  const [requiredFields, setRequiredFields] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL;
        const res = await fetch(`${API_BASE}/options`);
        if (!res.ok) throw new Error("Failed to fetch options");

        const data = await res.json();

        const { requiredFields: reqFields, state, country, ...rest } = data;

        setDropdowns({
          ...rest,
          country: country.map((c) => ({
            name: c.name,
            isoCode: c.isoCode || c.iso2,
            phoneCode: c.phoneCode || c.phonecode || "",
          })),
          state,
        });

        setRequiredFields(reqFields || []);
      } catch (err) {
        console.error("Options fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const getStatesByCountry = (countryIso) => {
    if (!dropdowns.state || !countryIso) return [];
    return dropdowns.state[countryIso] || [];
  };

  return (
    <OptionsContext.Provider
      value={{ dropdowns, requiredFields, loading, error, getStatesByCountry }}
    >
      {children}
    </OptionsContext.Provider>
  );
};

export default OptionsProvider;
