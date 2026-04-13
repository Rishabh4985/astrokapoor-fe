import React, { useState, useCallback, useEffect, useRef } from "react";
import { SellerContext } from "./SellerContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";

const API_BASE = `${import.meta.env.VITE_API_URL}/seller`;

const toYmdUtc = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";
  // Keep date rendering timezone-safe for date-only records.
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

const SellerProvider = ({ children }) => {
  const { authToken, currentSeller, logout } = useAuth();

  const [sellerRecords, setSellerRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});

  const limit = 100;

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

  const isMountedRef = useRef(true);
  const latestRecordsRequestIdRef = useRef(0);
  const latestChartRequestIdRef = useRef({
    "monthly-sales": 0,
    "sales-vs-refund": 0,
    "status-count": 0,
  });
  const unauthorizedHandledRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    unauthorizedHandledRef.current = false;
  }, [authToken]);

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
    (error, fallbackMessage = "Session expired. Please login again.") => {
      const statusCode = error?.response?.status;
      if (statusCode !== 401 && statusCode !== 403) {
        return false;
      }

      if (!unauthorizedHandledRef.current) {
        unauthorizedHandledRef.current = true;
        toast.error(error?.response?.data?.message || fallbackMessage);
        logout();
      }
      return true;
    },
    [logout],
  );

  const fetchRecords = useCallback(
    async (pageNumber = 1, appliedFilters = {}) => {
      if (!authToken) return;
      const requestId = latestRecordsRequestIdRef.current + 1;
      latestRecordsRequestIdRef.current = requestId;

      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: pageNumber,
          limit,
        });

        appendFilterParams(params, appliedFilters);

        const res = await axios.get(
          `${API_BASE}/records/handler?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          },
        );

        const dataArray = Array.isArray(res.data.records)
          ? res.data.records
          : Array.isArray(res.data)
            ? res.data
            : [];

        const cleanedData = dataArray.map(cleanRecord);
        if (
          !isMountedRef.current ||
          requestId !== latestRecordsRequestIdRef.current
        )
          return;

        setSellerRecords(cleanedData);

        setTotalRecords(res.data.totalRecords || cleanedData.length);
        setTotalPages(
          res.data.totalPages ||
            Math.ceil((res.data.totalRecords || 0) / limit),
        );
        setPage(res.data.currentPage || res.data.page || pageNumber);
      } catch (error) {
        if (
          !isMountedRef.current ||
          requestId !== latestRecordsRequestIdRef.current
        )
          return;
        if (handleUnauthorizedError(error)) return;
        console.error("Failed to fetch seller records", error);
      } finally {
        if (
          isMountedRef.current &&
          requestId === latestRecordsRequestIdRef.current
        ) {
          setLoading(false);
        }
      }
    },
    [
      authToken,
      limit,
      cleanRecord,
      appendFilterParams,
      handleUnauthorizedError,
    ],
  );

  const fetchAllRecordsForExport = useCallback(
    async (appliedFilters = filters) => {
      if (!authToken) return [];

      const pageLimit = 500;
      const allRecords = [];
      let exportPage = 1;
      let totalPagesForExport = 1;

      try {
        do {
          const params = new URLSearchParams({
            page: exportPage,
            limit: pageLimit,
          });
          appendFilterParams(params, appliedFilters);

          const res = await axios.get(
            `${API_BASE}/records/handler?${params.toString()}`,
            {
              headers: { Authorization: `Bearer ${authToken}` },
            },
          );

          const dataArray = Array.isArray(res.data.records)
            ? res.data.records
            : Array.isArray(res.data)
              ? res.data
              : [];

          allRecords.push(...dataArray.map(cleanRecord));

          totalPagesForExport = Math.max(res.data.totalPages || 1, 1);
          exportPage += 1;
        } while (exportPage <= totalPagesForExport);

        return allRecords;
      } catch (error) {
        if (handleUnauthorizedError(error)) {
          throw new Error("Session expired. Please login again.");
        }
        console.error("Failed to fetch all seller records for export", error);
        throw new Error(
          error.response?.data?.message || "Failed to fetch records for export",
        );
      }
    },
    [
      authToken,
      cleanRecord,
      filters,
      appendFilterParams,
      handleUnauthorizedError,
    ],
  );

  const fetchChartData = useCallback(
    async (chartType) => {
      if (!authToken) return [];
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

        const url = params.toString()
          ? `${API_BASE}/charts/${chartType}?${params.toString()}`
          : `${API_BASE}/charts/${chartType}`;

        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${authToken}` },
          timeout: 20000,
        });

        const result = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data.records)
            ? response.data.records
            : [];

        if (isStaleRequest()) return [];

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
        if (isStaleRequest()) return [];
        if (handleUnauthorizedError(error)) {
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

        console.error(`Failed to fetch ${chartType} data:`, error);
        setChartData((prev) => ({
          ...prev,
          [chartType]: {
            ...prev[chartType],
            loading: false,
            error: error.message,
          },
        }));

        return [];
      }
    },
    [authToken, filters, appendFilterParams, handleUnauthorizedError],
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

  useEffect(() => {
    if (!authToken) return;

    fetchMonthlySalesData();
    fetchSalesVsRefundData();
    fetchStatusData();
  }, [
    filters,
    authToken,
    fetchMonthlySalesData,
    fetchSalesVsRefundData,
    fetchStatusData,
  ]);

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

  const importSellerRecords = useCallback(
    (importedRecords) => {
      const sellerEmail = currentSeller?.email?.toLowerCase().trim();
      if (!sellerEmail) return;

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
        handlerId: record.handlerId?.toString().trim() || "",
        dateOfPayment: formatDate(record.dateOfPayment),
      }));

      const ownRecords = flatRecords.filter((record) => {
        const handler = record.handlerId?.toString().trim().toLowerCase();
        return !handler || handler === sellerEmail;
      });

      setSellerRecords((prev) => [...prev, ...ownRecords]);
    },
    [currentSeller],
  );

  const addSellerRecord = useCallback(
    async (newRecord) => {
      try {
        if (!authToken) throw new Error("No Auth Token");
        const normalize = (val) => val?.toString().toLowerCase().trim();
        const normalizePhone = (val) => val?.toString().trim();
        const sellerEmail = currentSeller?.email?.toLowerCase().trim();
        if (!sellerEmail) {
          throw new Error("Seller identity not available");
        }

        const recordToSend = {
          ...newRecord,
          email1: normalize(newRecord.email1),
          email2: normalize(newRecord.email2),
          mobile1: normalizePhone(newRecord.mobile1),
          mobile2: normalizePhone(newRecord.mobile2),
          customerName: newRecord.customerName || "Unknown",
          handlerId: sellerEmail,
        };

        const res = await axios.post(`${API_BASE}/records`, recordToSend, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (res?.data) {
          await fetchRecords(page, filters);
        }
        return res;
      } catch (error) {
        if (handleUnauthorizedError(error)) {
          throw new Error("Session expired. Please login again.");
        }
        console.error("Failed to add record", error);
        throw error;
      }
    },
    [
      authToken,
      currentSeller,
      fetchRecords,
      page,
      filters,
      handleUnauthorizedError,
    ],
  );

  const updateSellerRecord = useCallback(
    async (recordData) => {
      try {
        if (!authToken) throw new Error("No Auth Token");
        if (!recordData._id) throw new Error("Record ID is missing");

        const recordId = recordData._id;

        // Convert dateOfPayment string back to proper Date format
        let updatePayload = { ...recordData };

        // Convert edited date values to Date objects before sending
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

        // Remove fields we don't want to update
        const {
          _id,
          _handlerId,
          _createdAt,
          _updatedAt,
          ___v,
          ...cleanPayload
        } = updatePayload;

        const response = await axios.patch(
          `${API_BASE}/records/${recordId}`,
          cleanPayload,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          },
        );

        await fetchRecords(page, filters);
        return response;
      } catch (err) {
        if (handleUnauthorizedError(err)) {
          throw new Error("Session expired. Please login again.");
        }
        toast.error(err.response?.data?.message || "Failed to update record");
        throw err;
      }
    },
    [authToken, page, fetchRecords, filters, handleUnauthorizedError],
  );

  const updateSellerProfile = useCallback((updatedSeller) => {
    localStorage.setItem("currentSeller", JSON.stringify(updatedSeller));
    const allSalespersons =
      JSON.parse(localStorage.getItem("salespersons")) || [];
    const updatedSalespersons = allSalespersons.map((sp) =>
      sp.email === updatedSeller.email ? updatedSeller : sp,
    );
    localStorage.setItem("salespersons", JSON.stringify(updatedSalespersons));
  }, []);

  const getRecordHistory = useCallback(
    async (recordId) => {
      if (!authToken) throw new Error("No Auth Token");
      try {
        const res = await axios.get(`${API_BASE}/records/${recordId}/history`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        return res.data;
      } catch (error) {
        if (handleUnauthorizedError(error)) {
          throw new Error("Session expired. Please login again.");
        }
        throw error;
      }
    },
    [authToken, handleUnauthorizedError],
  );

  return (
    <SellerContext.Provider
      value={{
        sellerRecords,
        filters,
        setFilters,
        totalRecords,
        setSellerRecords,
        setPage,
        page,
        totalPages,
        loading,
        goToPage,
        importSellerRecords,
        addSellerRecord,
        updateSellerRecord,
        updateSellerProfile,
        fetchRecords,
        fetchAllRecordsForExport,
        getRecordHistory,

        // Chart data and fetchers
        chartData,
        fetchMonthlySalesData,
        fetchSalesVsRefundData,
        fetchStatusData,
        refreshChartData,
        clearChartCache,
      }}
    >
      {children}
    </SellerContext.Provider>
  );
};

export default SellerProvider;
