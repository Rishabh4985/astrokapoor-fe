import { useEffect, useState } from "react";
import OptionsContext from "./OptionsContext";

const OptionsProvider = ({ children }) => {
  const [dropdowns, setDropdowns] = useState({
    service: [],
    mode: [],
    category: [],
    status: [],
    overallRating: [],
    state: [],
    country: [],
    expert: [],
    handleBy: [],
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

        const { requiredFields, ...dropdownData } = data;

        setDropdowns(dropdownData);
        setRequiredFields(requiredFields || []);
      } catch (err) {
        console.error("Options fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  return (
    <OptionsContext.Provider
      value={{ dropdowns, requiredFields, loading, error }}
    >
      {children}
    </OptionsContext.Provider>
  );
};

export default OptionsProvider;
