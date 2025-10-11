import React, { useState, useCallback, useEffect } from "react";
import { SellerContext } from "./SellerContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";

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
  const [limit] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingCharts, setLoadingCharts] = useState(false);

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
          `/api/seller/records/paginated?page=${pageNumber}&limit=${limit}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );

        const { records: fetchedRecords, totalPages, totalRecords } = res.data;
        const cleanedData = fetchedRecords.map(cleanRecord);

        setSellerRecords(cleanedData);
        setTotalPages(totalPages);
        setTotalRecords(totalRecords);
        setPage(pageNumber);

        sessionStorage.setItem("userList", JSON.stringify(cleanedData));
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

      const res = await axios.get(`/api/seller/records/charts`, {
        headers: { Authorization: `Bearer ${authToken}` },
        timeout: 15000,
      });

      const cleanedData = res.data.map(cleanRecord);
      setAllRecords(cleanedData);
    } catch (error) {
      console.log("Failed to fetch all records for charts", error);
    } finally {
      setLoadingCharts(false);
    }
  }, [authToken, cleanRecord]);

  useEffect(() => {
    if (!authToken) {
      console.warn("SellerProvider: authToken not ready yet, skipping fetch");
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

        const res = await axios.post("/api/seller/records", recordToSend, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        const savedRecord = res.data.record || res.data;
        const formattedRecord = cleanRecord(savedRecord);

        setSellerRecords((prev) => {
          const updated = [...prev, formattedRecord];
          return updated.sort((a, b) => {
            const dateA = new Date(a.dateOfPayment);
            const dateB = new Date(b.dateOfPayment);
            return dateB - dateA;
          });
        });

        setAllRecords((prev) => {
          const updated = [...prev, formattedRecord];
          return updated.sort((a, b) => {
            const dateA = new Date(a.dateOfPayment);
            const dateB = new Date(b.dateOfPayment);
            return dateB - dateA;
          });
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

        await axios.patch(`/api/seller/records/${record._id}`, record, {
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

    const allSalespersons =
      JSON.parse(localStorage.getItem("salespersons")) || [];

    const updatedSalespersons = allSalespersons.map((sp) =>
      sp.email === updatedSeller.email ? updatedSeller : sp
    );

    localStorage.setItem("salespersons", JSON.stringify(updatedSalespersons));
  }, []);

  const fetchSellerRecords = useCallback(async () => {
    try {
      if (!authToken) throw new Error("No Auth Token");

      const res = await axios.get("/api/seller/records", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const cleanedData = res.data.map(cleanRecord);
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
      }}
    >
      {children}
    </SellerContext.Provider>
  );
};

export default SellerProvider;
