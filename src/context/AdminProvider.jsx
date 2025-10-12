import React, { useState, useEffect, useCallback, useRef } from "react";
import { AdminContext } from "./AdminContext";
import axios from "axios";
import { useAuth } from "./AuthContext";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:4000/api/admin"
  : `${import.meta.env.VITE_API_URL}/admin`;

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const AdminProvider = ({ children }) => {
  const { authToken } = useAuth();
  const [error, setError] = useState(null);
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);

  const [allRecords, setAllRecords] = useState([]);
  const [loadingCharts, setLoadingCharts] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const cleanRecord = useCallback((record) => {
    const omitKeys = (obj, keys) => {
      const result = { ...obj };
      keys.forEach((key) => delete result[key]);
      return result;
    };

    const filtered = omitKeys(record, ["_id", "createdAt", "updatedAt", "__v"]);

    return {
      ...filtered,
      dateOfPayment: formatDate(filtered.dateOfPayment),
    };
  }, []);

  //fetch records
  const fetchRecords = useCallback(
    async (pageNumber = 1) => {
      if (!isMountedRef.current) return;

      try {
        setLoading(true);
        setError(null);

        if (!authToken) {
          console.warn("fetchRecords skipped: authToken missing");
          return;
        }

        const res = await axios.get(
          `${API_BASE}/records?page=${pageNumber}&limit=${limit}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
            timeout: 10000,
          }
        );

        if (!isMountedRef.current) return;
        console.log("Fetched records response:", res.data);

        const dataArray = Array.isArray(res.data.records)
          ? res.data.records
          : [];
        const cleanedData = dataArray.map(cleanRecord);

        setRecords(cleanedData);
        setTotalPages(res.data.totalPages || 1);
        setTotalRecords(res.data.totalRecords || cleanedData.length);
        setPage(pageNumber);
      } catch (error) {
        if (!isMountedRef.current) return;

        console.error("Failed to fetch data", error);
        setError("Failed to fetch records. Please try again.");
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [authToken, limit, cleanRecord]
  );

  //chart records
  const fetchAllRecordsForCharts = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setLoadingCharts(true);
      setError(null);

      if (!authToken) {
        console.warn("fetchAllRecordsForCharts skipped: authToken missing");
        return;
      }

      const res = await axios.get(`${API_BASE}/records/all`, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 30000,
      });

      if (!isMountedRef.current) return;

      const dataArray = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.records)
        ? res.data.records
        : [];

      const cleanedData = dataArray.map(cleanRecord);
      setAllRecords(cleanedData);
    } catch (error) {
      if (!isMountedRef.current) return;

      console.error("Failed to fetch all records for charts", error);
      setError("Failed to load chart data. Please refresh.");
    } finally {
      if (isMountedRef.current) {
        setLoadingCharts(false);
      }
    }
  }, [authToken, cleanRecord]);

  useEffect(() => {
    if (!authToken) {
      console.warn("AdminProvider: authToken not ready yet");
      return;
    }
    fetchRecords(1);
    fetchAllRecordsForCharts();
  }, [authToken, fetchRecords, fetchAllRecordsForCharts]);

  const goToPage = useCallback(
    (pageNumber) => {
      if (pageNumber < 1 || pageNumber > totalPages) return;
      fetchRecords(pageNumber);
    },
    [fetchRecords, totalPages]
  );

  //import records
  const importRecords = useCallback((importedRecords) => {
    try {
      setError(null);

      const normalize = (val) =>
        typeof val === "string"
          ? val.toLowerCase().trim()
          : val?.toString().trim();

      const flatRecords = importedRecords.map((record) => ({
        ...record,
        email1: normalize(record.email1),
        email2: normalize(record.email2),
        mobile1: normalize(record.mobile1),
        mobile2: normalize(record.mobile2),
        customerName: record.customerName || "Unknown",
        dateOfPayment: formatDate(record.dateOfPayment),
      }));

      setRecords((prev) => {
        const combined = [...prev, ...flatRecords];
        return combined;
      });
      setAllRecords((prev) => [...prev, ...flatRecords]);
    } catch (error) {
      console.error("Failed to import records:", error);
      setError("Failed to import records. Please check the data format.");
    }
  }, []);

  //add records
  const addRecord = useCallback(
    async (newRecord) => {
      try {
        setError(null);

        if (!authToken) return;

        const normalize = (val) => val?.toString().toLowerCase().trim();
        const normalizePhone = (val) => val?.toString().trim();

        const recordToSend = {
          ...newRecord,
          email1: normalize(newRecord.email1),
          email2: normalize(newRecord.email2),
          mobile1: normalizePhone(newRecord.mobile1),
          mobile2: normalizePhone(newRecord.mobile2),
          customerName: newRecord.customerName || "Unknown",
        };

        const res = await axios.post(`${API_BASE}/records`, recordToSend, {
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: 10000,
        });

        const savedRecord = res.data.record || res.data;

        const formattedRecord = cleanRecord(savedRecord);

        setRecords((prev) => {
          const updated = [...prev, formattedRecord];
          return updated;
        });

        setAllRecords((prev) => {
          const updated = [...prev, formattedRecord];
          return updated;
        });
      } catch (error) {
        console.error("Failed to add record", error);
        setError("Failed to add record. Please try again.");
        throw error;
      }
    },
    [authToken, cleanRecord]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AdminContext.Provider
      value={{
        records,
        setRecords,
        addRecord,
        importRecords,
        page,
        setPage,
        totalPages,
        totalRecords,
        loading,
        goToPage,
        allRecords,
        loadingCharts,
        error,
        clearError,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export default AdminProvider;
