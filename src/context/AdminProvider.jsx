import React, { useState, useEffect, useCallback, useRef } from "react";
import { AdminContext } from "./AdminContext";
import axios from "axios";
import { useAuth } from "./AuthContext";

const API_BASE = `${import.meta.env.VITE_API_URL}/admin`;

const toYmdUtc = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AdminProvider = ({ children }) => {
  const { authToken, userRole, logout } = useAuth();
  const [error, setError] = useState(null);

  // Records state
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  const limit = 100;

  const isMountedRef = useRef(true);
  const latestRecordsRequestIdRef = useRef(0);
  const latestChartRequestIdRef = useRef({
    "monthly-sales": 0,
    "sales-vs-refund": 0,
    "status-count": 0,
  });
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return "";

    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    // Keep date rendering timezone-safe for date-only records.
    const day = String(d.getUTCDate()).padStart(2, "0");
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const year = d.getUTCFullYear();

    return `${day}/${month}/${year}`;
  }, []);

  // Clean record and remove unused fields
  const cleanRecord = useCallback(
    (record) => {
      const {
        __v,
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        ...rest
      } = record;
      return { ...rest, dateOfPayment: formatDate(rest.dateOfPayment) };
    },
    [formatDate],
  );

  const appendFilterParams = useCallback((params, appliedFilters = {}) => {
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value === null || value === "" || value === "all") return;

      const paramKey = key === "query" ? "search" : key;
      if (Array.isArray(value)) {
        value
          .map((item) => item?.toString().trim())
          .filter(Boolean)
          .forEach((item) => params.append(paramKey, item));
        return;
      }

      params.append(paramKey, value.toString().trim());
    });
  }, []);

  const handleUnauthorizedError = useCallback(
    (err, fallbackMessage = "Session expired. Please login again.") => {
      const statusCode = err?.response?.status;
      if (statusCode !== 401 && statusCode !== 403) {
        return false;
      }

      if (isMountedRef.current) {
        setError(err?.response?.data?.message || fallbackMessage);
      }

      logout();
      return true;
    },
    [logout],
  );

  // Fetch records with filters + pagination
  const fetchRecords = useCallback(
    async (pageNumber = 1, appliedFilters = {}) => {
      if (!authToken) return;
      const requestId = latestRecordsRequestIdRef.current + 1;
      latestRecordsRequestIdRef.current = requestId;

      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ page: pageNumber, limit });
        appendFilterParams(params, appliedFilters);

        const res = await axios.get(
          `${API_BASE}/records/all?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          },
        );

        const cleaned = Array.isArray(res.data.records)
          ? res.data.records.map(cleanRecord)
          : [];

        if (!isMountedRef.current || requestId !== latestRecordsRequestIdRef.current) return;

        setRecords(cleaned);
        setPage(res.data.page || pageNumber);
        setTotalPages(res.data.totalPages || 1);
        setTotalRecords(res.data.totalRecords || cleaned.length);
      } catch (err) {
        if (!isMountedRef.current || requestId !== latestRecordsRequestIdRef.current) return;
        if (handleUnauthorizedError(err)) return;
        console.error("Failed to fetch records", err);
        setError(err.response?.data?.message || "Failed to fetch records");
      } finally {
        if (
          isMountedRef.current &&
          requestId === latestRecordsRequestIdRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [authToken, limit, cleanRecord, appendFilterParams, handleUnauthorizedError],
  );

  const fetchAllRecordsForExport = useCallback(
    async (appliedFilters = filters) => {
      if (!authToken) return [];

      const pageLimit = 200;
      const allRecords = [];
      let exportPage = 1;
      let totalPages = 1;

      try {
        do {
          const params = new URLSearchParams({
            page: exportPage,
            limit: pageLimit,
          });
          appendFilterParams(params, appliedFilters);

          const res = await axios.get(
            `${API_BASE}/records/all?${params.toString()}`,
            {
              headers: { Authorization: `Bearer ${authToken}` },
            },
          );

          const cleaned = Array.isArray(res.data.records)
            ? res.data.records.map(cleanRecord)
            : [];

          allRecords.push(...cleaned);

          totalPages = Math.max(res.data.totalPages || 1, 1);
          exportPage += 1;
        } while (exportPage <= totalPages);

        return allRecords;
      } catch (err) {
        if (handleUnauthorizedError(err)) {
          throw new Error("Session expired. Please login again.");
        }
        console.error("Failed to fetch all records for export", err);
        throw new Error(
          err.response?.data?.message || "Failed to fetch records for export",
        );
      }
    },
    [authToken, cleanRecord, filters, appendFilterParams, handleUnauthorizedError],
  );

  // Trigger fetch when filters or page changes
  const filtersString = JSON.stringify(filters);
  const lastAppliedFiltersRef = useRef(filtersString);

  useEffect(() => {
    if (!authToken) return;

    const filtersChanged = lastAppliedFiltersRef.current !== filtersString;
    if (filtersChanged && page !== 1) {
      lastAppliedFiltersRef.current = filtersString;
      setPage(1);
      return;
    }

    lastAppliedFiltersRef.current = filtersString;
    const parsedFilters = JSON.parse(filtersString);
    fetchRecords(page, parsedFilters);
  }, [page, authToken, fetchRecords, filtersString]);

  const goToPage = useCallback(
    (pageNumber) => {
      if (pageNumber < 1 || pageNumber > totalPages) return;
      setPage(pageNumber);
    },
    [totalPages],
  );

  // CRUD: Add / Update / Delete / GetById

  const importRecords = useCallback(async () => {
    try {
      setError(null);
      if (page !== 1) {
        setPage(1);
        return { success: true };
      }

      await fetchRecords(1, filters);
      return { success: true };
    } catch (err) {
      console.error("Import refresh failed", err);
      return { success: false };
    }
  }, [fetchRecords, filters, page]);

  const addRecord = useCallback(
    async (newRecord) => {
      if (!authToken) return false;
      try {
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

        const res = await axios.post(`${API_BASE}/records/add`, recordToSend, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (res?.data) {
          await fetchRecords(page, filters);
        }
        return true;
      } catch (err) {
        if (handleUnauthorizedError(err)) return false;
        console.error("Failed to add record", err);
        setError("Failed to add record. Please try again.");
        return false;
      }
    },
    [authToken, fetchRecords, page, filters, handleUnauthorizedError],
  );

  const updateRecord = useCallback(
    async (id, partialUpdate) => {
      if (!authToken) return false;
      try {
        setError(null);

        const updatePayload = { ...partialUpdate };

        if (typeof updatePayload.dateOfPayment === "string") {
          const trimmedDate = updatePayload.dateOfPayment.trim();

          if (trimmedDate.includes("/")) {
            const [day, month, year] = trimmedDate.split("/");
            if (day && month && year) {
              updatePayload.dateOfPayment = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
            }
          } else if (trimmedDate) {
            const parsedDate = new Date(trimmedDate);
            if (!Number.isNaN(parsedDate.getTime())) {
              updatePayload.dateOfPayment = toYmdUtc(parsedDate);
            }
          }
        }

        const res = await axios.patch(
          `${API_BASE}/records/${id}`,
          updatePayload,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          },
        );

        if (res?.data) {
          await fetchRecords(page, filters);
        }
        return true;
      } catch (err) {
        if (handleUnauthorizedError(err)) return false;
        console.error("Failed to update record", err);
        setError(
          err.response?.data?.message ||
            "Failed to update record. Please try again.",
        );
        return false;
      }
    },
    [authToken, fetchRecords, page, filters, handleUnauthorizedError],
  );

  const getRecordById = useCallback(
    async (id) => {
      if (!authToken) return null;
      try {
        setError(null);
        const res = await axios.get(`${API_BASE}/records/${id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        return cleanRecord(res.data.record || res.data);
      } catch (err) {
        if (handleUnauthorizedError(err)) return null;
        console.error("Failed to fetch record by ID", err);
        setError(err.response?.data?.message || "Failed to fetch record.");
        return null;
      }
    },
    [authToken, cleanRecord, handleUnauthorizedError],
  );

  const deleteRecord = useCallback(
    async (id) => {
      if (!authToken) return false;
      try {
        setError(null);
        await axios.delete(`${API_BASE}/records/${id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        const targetPage = records.length === 1 && page > 1 ? page - 1 : page;
        await fetchRecords(targetPage, filters);
        return true;
      } catch (err) {
        if (handleUnauthorizedError(err)) return false;
        console.error("Failed to delete record", err);
        setError(err.response?.data?.message || "Failed to delete record.");
        return false;
      }
    },
    [authToken, fetchRecords, filters, page, records.length, handleUnauthorizedError],
  );

  const clearError = useCallback(() => setError(null), []);

  // Chart state (unchanged)
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

  const fetchChartData = useCallback(
    async (chartType) => {
      if (!authToken || userRole !== "admin") return [];
      const requestId = (latestChartRequestIdRef.current[chartType] || 0) + 1;
      latestChartRequestIdRef.current[chartType] = requestId;
      const isStaleRequest = () =>
        !isMountedRef.current ||
        latestChartRequestIdRef.current[chartType] !== requestId;

      try {
        setChartData((prev) => ({
          ...prev,
          [chartType]: { ...prev[chartType], loading: true, error: null },
        }));

        const params = new URLSearchParams();
        appendFilterParams(params, filters);

        const queryString = params.toString();
        const url = queryString
          ? `${API_BASE}/charts/${chartType}?${queryString}`
          : `${API_BASE}/charts/${chartType}`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        if (isStaleRequest()) return [];

        setChartData((prev) => ({
          ...prev,
          [chartType]: {
            data,
            loading: false,
            error: null,
            lastFetched: Date.now(),
          },
        }));

        return data;
      } catch (err) {
        if (isStaleRequest()) return [];

        if (handleUnauthorizedError(err)) {
          setChartData((prev) => ({
            ...prev,
            [chartType]: {
              ...prev[chartType],
              loading: false,
              error: "Session expired. Please login again.",
            },
          }));
          return [];
        }
        console.error(`Failed to fetch ${chartType}`, err);

        setChartData((prev) => ({
          ...prev,
          [chartType]: {
            ...prev[chartType],
            loading: false,
            error: err.message,
          },
        }));

        return [];
      }
    },
    [authToken, userRole, filters, appendFilterParams, handleUnauthorizedError],
  );

  const fetchMonthlySalesData = useCallback(
    () => fetchChartData("monthly-sales"),
    [fetchChartData],
  );
  const fetchSalesVsRefundData = useCallback(
    () => fetchChartData("sales-vs-refund"),
    [fetchChartData],
  );
  const fetchStatusData = useCallback(
    () => fetchChartData("status-count"),
    [fetchChartData],
  );
  const refreshChartData = useCallback(
    (chartType) => fetchChartData(chartType),
    [fetchChartData],
  );
  const clearChartCache = useCallback(
    () =>
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
      }),
    [],
  );

  useEffect(() => {
    if (!authToken || userRole !== "admin") {
      return;
    }
    fetchMonthlySalesData();
    fetchSalesVsRefundData();
    fetchStatusData();
  }, [
    filters,
    authToken,
    userRole,
    fetchMonthlySalesData,
    fetchSalesVsRefundData,
    fetchStatusData,
  ]);

  return (
    <AdminContext.Provider
      value={{
        records,
        page,
        totalPages,
        totalRecords,
        loading,
        error,
        filters,
        setFilters,
        goToPage,
        fetchRecords,
        addRecord,
        updateRecord,
        deleteRecord,
        getRecordById,
        clearError,
        chartData,
        fetchMonthlySalesData,
        fetchSalesVsRefundData,
        fetchStatusData,
        refreshChartData,
        clearChartCache,
        setRecords,
        importRecords,
        fetchAllRecordsForExport,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export default AdminProvider;
