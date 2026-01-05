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
  const { authToken, userRole } = useAuth();
  const [error, setError] = useState(null);

  // Existing records state
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [allRecords, setAllRecords] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);

  // NEW: Chart data state
  const [chartData, setChartData] = useState({
    "monthly-sales": {
      data: [],
      loading: false,
      error: null,
      lastFetched: null,
    },
    "sales-vs-refund": {
      data: [],
      loading: false,
      error: null,
      lastFetched: null,
    },
    "status-count": {
      data: [],
      loading: false,
      error: null,
      lastFetched: null,
    },
  });

  const chartDataRef = useRef(chartData);

  const isMountedRef = useRef(true);

  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    chartDataRef.current = chartData;
  }, [chartData]);

  //function to check if data is stale
  const isDataStale = useCallback(
    (lastFetched) => {
      if (!lastFetched) return true;
      return Date.now() - lastFetched > CACHE_DURATION;
    },
    [CACHE_DURATION]
  );

  // Generic chart data fetcher
  const fetchChartData = useCallback(
    async (chartType) => {
      if (!authToken || userRole !== "admin") return [];

      // Use cached data if fresh
      const currentChartData = chartDataRef.current[chartType];
      if (
        currentChartData &&
        currentChartData.data.length > 0 &&
        !isDataStale(currentChartData.lastFetched)
      ) {
        return currentChartData.data;
      }

      try {
        setChartData((prev) => ({
          ...prev,
          [chartType]: { ...prev[chartType], loading: true, error: null },
        }));

        const res = await axios.get(`${API_BASE}/charts/${chartType}`, {
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: 20000,
        });

        if (!isMountedRef.current) return [];

        const result = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];

        setChartData((prev) => ({
          ...prev,
          [chartType]: {
            data: result,
            loading: false,
            error: null,
            lastFetched: Date.now(),
          },
        }));

        return result;
      } catch (error) {
        if (!isMountedRef.current) return [];

        console.error(`Failed to fetch ${chartType} data:`, error);
        setChartData((prev) => ({
          ...prev,
          [chartType]: {
            ...prev[chartType],
            loading: false,
            error:
              error.response?.data?.message ||
              error.message ||
              "Failed to fetch chart data",
          },
        }));
        return [];
      }
    },
    [authToken, userRole, isDataStale]
  );

  // Specific chart data fetchers
  const fetchMonthlySalesData = useCallback(
    () => fetchChartData("monthly-sales"),
    [fetchChartData]
  );
  const fetchSalesVsRefundData = useCallback(
    () => fetchChartData("sales-vs-refund"),
    [fetchChartData]
  );
  const fetchStatusData = useCallback(
    () => fetchChartData("status-count"),
    [fetchChartData]
  );

  // Force refresh chart data
  const refreshChartData = useCallback(
    (chartType) => {
      setChartData((prev) => ({
        ...prev,
        [chartType]: { ...prev[chartType], lastFetched: null },
      }));
      return fetchChartData(chartType);
    },
    [fetchChartData]
  );

  // Clear all chart cache
  const clearChartCache = useCallback(() => {
    setChartData({
      "monthly-sales": {
        data: [],
        loading: false,
        error: null,
        lastFetched: null,
      },
      "sales-vs-refund": {
        data: [],
        loading: false,
        error: null,
        lastFetched: null,
      },
      "status-count": {
        data: [],
        loading: false,
        error: null,
        lastFetched: null,
      },
    });
  }, []);

  const cleanRecord = useCallback((record) => {
    const omitKeys = (obj, keys) => {
      const result = { ...obj };
      keys.forEach((key) => delete result[key]);
      return result;
    };

    const filtered = omitKeys(record, ["createdAt", "updatedAt", "__v"]);

    return {
      ...filtered,
      dateOfPayment: formatDate(filtered.dateOfPayment),
    };
  }, []);

  // New paginated fetch
  const fetchRecords = useCallback(
    async (pageNumber = 1) => {
      if (!authToken) return;
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get(
          `${API_BASE}/records?page=${pageNumber}&limit=${limit}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
            timeout: 20000,
          }
        );

        if (!isMountedRef.current) return;

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
        console.error("Failed to fetch admin records", error);
        setError("Failed to fetch records. Please try again.");
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    },
    [authToken, limit, cleanRecord]
  );

  const fetchAllRecords = useCallback(async () => {
    if (!authToken) return;
    try {
      setLoadingAll(true);
      setError(null);
      const res = await axios.get(`${API_BASE}/records?limit=1000000`, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 60000,
      });

      const dataArray = Array.isArray(res.data.records) ? res.data.records : [];
      const cleanedData = dataArray.map(cleanRecord);
      setAllRecords(cleanedData);
    } catch (error) {
      console.error("Failed to fetch all records", error);
      setError("Failed to fetch all records. Please try again.");
    } finally {
      setLoadingAll(false);
    }
  }, [authToken, cleanRecord]);

  useEffect(() => {
    if (!authToken) return;
    fetchRecords(1);
    fetchAllRecords();
  }, [authToken, fetchRecords, fetchAllRecords]);

  // Pagination control
  const goToPage = useCallback(
    (pageNumber) => {
      if (pageNumber < 1 || pageNumber > totalPages) return;
      fetchRecords(pageNumber);
    },
    [fetchRecords, totalPages]
  );

  // Local import
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

      setRecords((prev) => [...prev, ...flatRecords]);
    } catch (error) {
      console.error("Failed to import records:", error);
      setError("Failed to import records. Please check data format.");
    }
  }, []);

  // Add record
  const addRecord = useCallback(
    async (newRecord) => {
      try {
        if (!authToken) return;
        setError(null);

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
        });

        const savedRecord = res.data.record || res.data;
        const formatted = cleanRecord(savedRecord);

        setRecords((prev) => [...prev, formatted]);
      } catch (error) {
        console.error("Failed to add record", error);
        setError("Failed to add record. Please try again.");
      }
    },
    [authToken, cleanRecord]
  );

  const updateRecord = useCallback(
    async (id, partialUpdate) => {
      if (!authToken) return;

      try {
        setError(null);
        const res = await axios.patch(
          `${API_BASE}/records/${id}`,
          partialUpdate,
          {
            headers: { Authorization: `Bearer ${authToken}` },
            timeout: 20000,
          }
        );

        const updated = res.data.record || res.data;
        const cleaned = cleanRecord(updated);

        // Sync local state
        setRecords((prev) =>
          prev.map((rec) => (rec._id === cleaned._id ? cleaned : rec))
        );

        setAllRecords((prev) =>
          prev.map((rec) => (rec._id === cleaned._id ? cleaned : rec))
        );
      } catch (error) {
        console.error("Failed to update record", error);
        setError(
          error.response?.data?.message ||
            "Failed to update record. Please try again."
        );
      }
    },
    [authToken, cleanRecord]
  );

  const getRecordById = useCallback(
    async (id) => {
      if (!authToken) return null;
      try {
        setError(null);
        const res = await axios.get(`${API_BASE}/records/${id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: 20000,
        });

        const record = res.data.record || res.data;
        const cleaned = cleanRecord(record);

        // Optionally sync into local state if not present
        setRecords((prev) => {
          const exists = prev.some((r) => r._id === cleaned._id);
          return exists
            ? prev.map((r) => (r._id === cleaned._id ? cleaned : r))
            : [...prev, cleaned];
        });

        return cleaned;
      } catch (error) {
        console.error("Failed to fetch record by id", error);
        setError(
          error.response?.data?.message ||
            "Failed to fetch record. Please try again."
        );
        return null;
      }
    },
    [authToken, cleanRecord]
  );

  const deleteRecord = useCallback(
    async (id) => {
      if (!authToken) return;

      try {
        setError(null);
        await axios.delete(`${API_BASE}/records/${id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: 20000,
        });

        // Remove from local lists
        setRecords((prev) => prev.filter((r) => r._id !== id));
        setAllRecords((prev) => prev.filter((r) => r._id !== id));

        // Optionally adjust totalRecords
        setTotalRecords((prev) => Math.max(prev - 1, 0));
      } catch (error) {
        console.error("Failed to delete record", error);
        setError(
          error.response?.data?.message ||
            "Failed to delete record. Please try again."
        );
      }
    },
    [authToken]
  );

  const clearError = useCallback(() => setError(null), []);

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
        allRecords,
        loadingAll,
        loading,
        goToPage,
        error,
        clearError,
        fetchRecords,
        updateRecord,
        getRecordById,
        deleteRecord,

        chartData,
        fetchMonthlySalesData,
        fetchSalesVsRefundData,
        fetchStatusData,
        refreshChartData,
        clearChartCache,
        isDataStale,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export default AdminProvider;
