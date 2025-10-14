import React, { useState, useCallback, useEffect, useRef } from "react";
import { SellerContext } from "./SellerContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:4000/api/seller"
  : `${import.meta.env.VITE_API_URL}/seller`;

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
  const [allRecords, setAllRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(500);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingCharts, setLoadingCharts] = useState(false);

  const [chartData, setChartData] = useState({
    "monthly-sales": { data: [], loading: false, error: null, lastFetched: null },
    "sales-vs-refund": { data: [], loading: false, error: null, lastFetched: null },
    "status-count": { data: [], loading: false, error: null, lastFetched: null },
  });

  const chartDataRef = useRef(chartData);

  useEffect(() => {
    chartDataRef.current = chartData;
  }, [chartData]);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const isDataStale = useCallback((lastFetched) => {
    if (!lastFetched) return true;
    return Date.now() - lastFetched > CACHE_DURATION;
  }, [CACHE_DURATION]);

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

  const fetchRecords = useCallback(
    async (pageNumber = 1) => {
      if (!authToken) return;
      try {
        setLoading(true);

        const res = await axios.get(
          `${API_BASE}/records/handler?page=${pageNumber}&limit=${limit}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        const dataArray = Array.isArray(res.data.records)
          ? res.data.records
          : Array.isArray(res.data)
          ? res.data
          : [];

        const cleanedData = dataArray.map(cleanRecord);

        setSellerRecords((prev) =>
          pageNumber === 1 ? cleanedData : [...prev, ...cleanedData]
        );

        setTotalRecords(res.data.totalRecords || cleanedData.length);
        setTotalPages(
          res.data.totalPages || Math.ceil((res.data.totalRecords || 0) / limit)
        );
        setPage(pageNumber);

        if (pageNumber === 1) {
          try {
            sessionStorage.setItem(
              "userList",
              JSON.stringify(cleanedData.slice(0, 500))
            );
          } catch (e) {
            console.warn("Skipping sessionStorage cache:", e.message);
          }
        }
      } catch (error) {
        console.log("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    },
    [authToken, limit, cleanRecord]
  );

  const fetchAllRecordsForCharts = useCallback(async () => {
    try {
      setLoadingCharts(true);
      if (!authToken) return;

      const res = await axios.get(`${API_BASE}/records/charts`, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 30000,
      });

      const dataArray = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.records)
        ? res.data.records
        : [];

      const cleanedData = dataArray.map(cleanRecord);
      setAllRecords(cleanedData);
    } catch (error) {
      console.log("Failed to fetch all records for charts", error);
    } finally {
      setLoadingCharts(false);
    }
  }, [authToken, cleanRecord]);

  const fetchChartData = useCallback(
    async (chartType) => {
      if (!authToken) return [];

      const currentChartData = chartDataRef.current[chartType];
      if (
        currentChartData &&
        currentChartData.data.length > 0 &&
        !isDataStale(currentChartData.lastFetched)
      ) {
        return currentChartData.data; // Return cached data
      }

      try {
        setChartData((prev) => ({
          ...prev,
          [chartType]: { ...prev[chartType], loading: true, error: null },
        }));

        const response = await axios.get(`${API_BASE}/records/charts/${chartType}`, {
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
    [authToken, isDataStale]
  );

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

  const clearChartCache = useCallback(() => {
    setChartData({
      "monthly-sales": { data: [], loading: false, error: null, lastFetched: null },
      "sales-vs-refund": { data: [], loading: false, error: null, lastFetched: null },
      "status-count": { data: [], loading: false, error: null, lastFetched: null },
    });
  }, []);

  useEffect(() => {
    if (!authToken) {
      console.warn("SellerProvider: authToken not ready yet, skipping fetch");
      return;
    }

    fetchRecords(1);
    fetchAllRecordsForCharts();
  }, [authToken, fetchRecords, fetchAllRecordsForCharts]);

  useEffect(() => {
    if (!authToken || totalPages <= 1) return;

    const fetchSequentially = async () => {
      try {
        let allFetched = [];
        for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
          const res = await axios.get(
            `${API_BASE}/records/handler?page=${pageNum}&limit=${limit}`,
            {
              headers: { Authorization: `Bearer ${authToken}` },
            }
          );

          const dataArray = Array.isArray(res.data.records) ? res.data.records : [];
          const cleaned = dataArray.map(cleanRecord);

          allFetched = [...allFetched, ...cleaned];
        }

        setSellerRecords((prev) => [...prev, ...allFetched]);
      } catch (err) {
        console.warn("Background prefetch stopped:", err.message);
      }
    };

    fetchSequentially();
  }, [authToken, totalPages, cleanRecord, limit]);

  const goToPage = useCallback(
    (pageNumber) => {
      if (pageNumber < 1 || pageNumber > totalPages) return;
      fetchRecords(pageNumber);
    },
    [fetchRecords, totalPages]
  );

  const importSellerRecords = useCallback(
    (importedRecords) => {
      const sellerEmail = currentSeller?.email.toLowerCase().trim();
      if (!sellerEmail) return;

      const normalize = (val) =>
        typeof val === "string" ? val.toLowerCase().trim() : val?.toString().trim();

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
      setAllRecords((prev) => [...prev, ...ownRecords]);
    },
    [currentSeller]
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

        const res = await axios.post(`${API_BASE}/records/handler`, recordToSend, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        const savedRecord = res.data.record || res.data;
        const formattedRecord = cleanRecord(savedRecord);

        setSellerRecords((prev) => {
          const updated = [...prev, formattedRecord];
          return updated.sort(
            (a, b) => new Date(b.dateOfPayment) - new Date(a.dateOfPayment)
          );
        });

        setAllRecords((prev) => {
          const updated = [...prev, formattedRecord];
          return updated.sort(
            (a, b) => new Date(b.dateOfPayment) - new Date(a.dateOfPayment)
          );
        });

        console.log("📥 Seller record added successfully");
      } catch (error) {
        console.error("Failed to add record", error);
        throw error;
      }
    },
    [authToken, currentSeller, cleanRecord]
  );

  const updateSellerRecord = useCallback(
    async (record) => {
      try {
        if (!authToken) throw new Error("No Auth Token");

        await axios.patch(`${API_BASE}/records/handler/${record._id}`, record, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        fetchRecords(page);
        fetchAllRecordsForCharts();
        toast.success("Record updated successfully");
      } catch (err) {
        console.error(err);
        toast.error("Failed to update record");
        throw err;
      }
    },
    [authToken, page, fetchRecords, fetchAllRecordsForCharts]
  );

  const updateSellerProfile = useCallback((updatedSeller) => {
    localStorage.setItem("currentSeller", JSON.stringify(updatedSeller));
    const allSalespersons = JSON.parse(localStorage.getItem("salespersons")) || [];
    const updatedSalespersons = allSalespersons.map((sp) =>
      sp.email === updatedSeller.email ? updatedSeller : sp
    );
    localStorage.setItem("salespersons", JSON.stringify(updatedSalespersons));
  }, []);

  const fetchSellerRecords = useCallback(async () => {
    try {
      if (!authToken) throw new Error("No Auth Token");

      const res = await axios.get(`${API_BASE}/records/handler`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const dataArray = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.records)
        ? res.data.records
        : [];

      const cleanedData = dataArray.map(cleanRecord);
      setSellerRecords(cleanedData);
    } catch (error) {
      console.error("Failed to fetch records", error);
      throw error;
    }
  }, [authToken, cleanRecord]);

  return (
    <SellerContext.Provider
      value={{
        sellerRecords,
        allRecords,
        totalRecords,
        setSellerRecords,
        setPage,
        page,
        totalPages,
        loading,
        loadingCharts,
        goToPage,
        importSellerRecords,
        addSellerRecord,
        updateSellerRecord,
        updateSellerProfile,
        fetchSellerRecords,
        fetchAllRecordsForCharts,
        fetchRecords,

        // Chart data and fetchers
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
    </SellerContext.Provider>
  );
};

export default SellerProvider;
