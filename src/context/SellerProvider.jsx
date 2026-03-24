import React, { useState, useCallback, useEffect, useRef } from "react";
import { SellerContext } from "./SellerContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";

const API_BASE = `${import.meta.env.VITE_API_URL}/seller`;

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const SellerProvider = ({ children }) => {
  const { authToken, currentSeller } = useAuth();

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

    const filtered = omitKeys(record, ["createdAt", "updatedAt", "__v"]);

    return {
      ...filtered,
      dateOfPayment: formatDate(filtered.dateOfPayment),
    };
  }, []);

  const fetchRecords = useCallback(
    async (pageNumber = 1, appliedFilters = {}) => {
      if (!authToken) return;

      try {
        setLoading(true);

        const params = new URLSearchParams({
          page: pageNumber,
          limit,
        });

        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (!value || value === "all") return;
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

        setSellerRecords(cleanedData);

        setTotalRecords(res.data.totalRecords || cleanedData.length);
        setTotalPages(
          res.data.totalPages ||
            Math.ceil((res.data.totalRecords || 0) / limit),
        );
        setPage(res.data.page || pageNumber);
      } catch (error) {
        console.log("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    },
    [authToken, limit, cleanRecord],
  );

  const fetchChartData = useCallback(
    async (chartType) => {
      if (!authToken) return [];

      try {
        setChartData((prev) => ({
          ...prev,
          [chartType]: { ...prev[chartType], loading: true, error: null },
        }));

        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== "all" && value !== "") {
            if (Array.isArray(value)) {
              value
                .map((item) => item?.toString().trim())
                .filter(Boolean)
                .forEach((item) => params.append(key, item));
            } else {
              params.append(key, value.toString().trim());
            }
          }
        });

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

        if (!isMountedRef.current) return [];

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
            error: error.message,
          },
        }));

        return [];
      }
    },
    [authToken, filters],
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

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const filtersString = JSON.stringify(filters);

  useEffect(() => {
    if (!authToken) return;

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
      const sellerEmail = currentSeller?.email.toLowerCase().trim();
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
        const normalize = (val) => val?.toString().toLowerCase().trim();
        const normalizePhone = (val) => val?.toString().trim();
        const sellerEmail = currentSeller?.email.toLowerCase().trim();

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

        const savedRecord = res.data.record || res.data;
        const formattedRecord = cleanRecord(savedRecord);

        setSellerRecords((prev) => {
          const parseDate = (str) => {
            const [day, month, year] = str.split("/");
            return new Date(`${year}-${month}-${day}`);
          };

          const updated = [...prev, formattedRecord];

          return updated.sort(
            (a, b) => parseDate(b.dateOfPayment) - parseDate(a.dateOfPayment),
          );
        });

        console.log("📥 Seller record added successfully");
        return res;
      } catch (error) {
        console.error("Failed to add record", error);
        throw error;
      }
    },
    [authToken, currentSeller, cleanRecord],
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
            updatePayload.dateOfPayment = new Date(`${year}-${month}-${day}`);
          } else if (trimmedDate) {
            const parsedDate = new Date(trimmedDate);
            if (!Number.isNaN(parsedDate.getTime())) {
              updatePayload.dateOfPayment = parsedDate;
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

        fetchRecords(page, filters);
        toast.success("Record updated successfully");
        return response;
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to update record");
        throw err;
      }
    },
    [authToken, page, fetchRecords, filters],
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
      const res = await axios.get(`${API_BASE}/records/${recordId}/history`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return res.data;
    },
    [authToken],
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
