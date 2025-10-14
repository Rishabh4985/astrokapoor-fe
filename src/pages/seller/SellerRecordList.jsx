import React, { useContext, useEffect, useState, useMemo } from "react";
import { SellerContext } from "../../context/SellerContext";
import Excel from "../../components/shared/Excel";
import { toast } from "react-toastify";
import {
  Search,
  Filter,
  ClipboardEdit,
  Globe,
  UserCheck,
  Send,
  XCircle,
  Table2,
} from "lucide-react";

const SellerRecordList = ({ onFilter }) => {
  const { sellerRecords, updateSellerRecord } = useContext(SellerContext);
  const [query, setQuery] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedRecord, setEditedRecord] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  const [filters, setFilters] = useState({
    status: "",
    service: "",
    country: "",
    expert: "",
    mode: "",
  });

  const currentSeller = JSON.parse(localStorage.getItem("currentSeller"));
  const sellerEmail = currentSeller?.email?.toLowerCase().trim();

  const visibleRecords = useMemo(() => {
    return Array.isArray(sellerRecords) ? sellerRecords : [];
  }, [sellerRecords]);

  const filteredRecords = useMemo(() => {
    return visibleRecords.filter((record) => {
      // Search match
      const matchesQuery = Object.values(record).some((val) =>
        String(val || "")
          .toLowerCase()
          .includes(query.toLowerCase())
      );

      // Filter match
      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        return (
          !value ||
          String(record[key] || "").toLowerCase() === value.toLowerCase()
        );
      });

      return matchesQuery && matchesFilters;
    });
  }, [visibleRecords, query, filters]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, itemsPerPage, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, filters]);

  useEffect(() => {
    if (onFilter) onFilter(filteredRecords);
  }, [filteredRecords, onFilter]);

  const nonEditableFields = ["transactionId", "dateOfPayment"];

  const expectedHeaders = [
    "dateOfPayment",
    "customerName",
    "amount",
    "pendingAmount",
    "refund",
    "status",
    "service",
    "mobile1",
    "mobile2",
    "email1",
    "email2",
    "expert",
    "handlerId",
    "handleBy",
    "mode",
    "country",
    "state",
    "transactionId",
    "sheet",
    "remark",
    "gems",
    "gems1",
    "gems2",
    "gems3",
    "gems4",
    "communication",
    "solutions",
    "solDetails",
    "overallRating",
    "remarks",
    "qualityDesc",
    "feedStatus",
    "additionalInfo",
    "feedbackComment",
    "address",
    "airBillNo",
    "productsName",
    "skuNo",
    "category",
  ];

  const dynamicHeaders = visibleRecords.reduce((set, record) => {
    Object.keys(record).forEach((key) => set.add(key));
    return set;
  }, new Set(expectedHeaders));

  const headers = Array.from(dynamicHeaders).filter(
    (key) => key.trim() !== "" && key !== "serialno"
  );

  const headerLabels = {
    customerName: "Customer Name",
    email1: "Email-1",
    email2: "Email-2",
    dateOfPayment: "Date of Payment",
    amount: "Amount",
    service: "Service",
    status: "Status",
    mobile1: "Mobile-1",
    mobile2: "Mobile-2",
    country: "Country",
    state: "State",
    transactionId: "Transaction ID",
    pendingAmount: "Pending Amount",
    refund: "Refund",
    handlerId: "Handler ID",
    handleBy: "Handled By",
    mode: "Mode",
    expert: "Expert",
    sheet: "Sheet",
    remark: "Remark",
    gems: "Gems",
    gems1: "Gem-1",
    gems2: "Gem-2",
    gems3: "Gem-3",
    gems4: "Gem-4",
    communication: "Communication",
    solutions: "Solutions",
    solDetails: "Solution Details",
    overallRating: "Overall Rating",
    remarks: "Remark",
    qualityDesc: "Quality Description",
    feedStatus: "Feed Status",
    additionalInfo: "Additional Info",
    feedbackComment: "Feedback Comment",
    address: "Address",
    airBillNo: "Air Bill Number",
    productsName: "Product Name",
    skuNo: "SKU NO",
    category: "Category",
  };

  const formatValue = (key, value) => {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "object") {
      if (value?.seconds) {
        const date = new Date(value.seconds * 1000);
        return date.toLocaleDateString("en-GB");
      }
      if (value instanceof Date) {
        return value.toLocaleDateString("en-GB");
      }
      if (value.label) return value.label;
      return JSON.stringify(value);
    }
    if (
      key.toLowerCase().includes("date") &&
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      const [year, month, day] = value.split("-");
      return `${day}/${month}/${year}`;
    }
    return value;
  };

  const handleExport = () => {
    toast.success(`Exporting ${filteredRecords.length} filtered records`);
    return filteredRecords;
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditedRecord({ ...filteredRecords[index] });
  };

  const handleChange = (key, value) => {
    setEditedRecord((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (index) => {
    const recordToSave = filteredRecords[index];
    const handler = (recordToSave.handlerId || "").toLowerCase().trim();

    if (!handler) {
      toast.error("You cannot edit public/unclaimed records.");
      return;
    }
    if (handler !== sellerEmail) {
      toast.error("You can only edit your own records.");
      return;
    }

    try {
      await updateSellerRecord(recordToSave._id, editedRecord);
      toast.success("Record updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update record.");
    }

    setEditingIndex(null);
    setEditedRecord({});
  };

  const getUniqueValues = (key) => {
    if (!visibleRecords?.length) return [];
    return [...new Set(visibleRecords.map((r) => r[key]).filter(Boolean))];
  };

  const startRecord = (currentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(
    currentPage * itemsPerPage,
    filteredRecords.length
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg mb-8 p-6 border border-orange-100 space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
        <h2 className="text-2xl font-bold text-orange-800 flex items-center gap-2">
          <Table2 className="w-6 h-6" />
          My Sales Records
          <span className="text-sm font-normal text-orange-600">
            ({filteredRecords.length} of {visibleRecords.length} records)
          </span>
        </h2>
        <div className="self-start sm:self-auto">
          <Excel onExport={handleExport} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-orange-400" />
          <input
            type="text"
            placeholder="Search across all records..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 pr-3 py-2 border border-orange-300 rounded-md text-sm w-full "
          />
          {query && (
            <XCircle
              className="absolute right-2 top-2.5 w-4 h-4 text-orange-300 cursor-pointer"
              onClick={() => setQuery("")}
            />
          )}
        </div>

        <div className="relative">
          <Filter className="absolute left-2 top-2.5 w-4 h-4 text-orange-400" />
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
            className="pl-8 pr-3 py-2 border border-orange-300 rounded-md text-sm w-full"
          >
            <option value="">{headerLabels.status}</option>
            {getUniqueValues("status").map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <ClipboardEdit className="absolute left-2 top-2.5 w-4 h-4 text-orange-400" />
          <select
            value={filters.service}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, service: e.target.value }))
            }
            className="pl-8 pr-3 py-2 border border-orange-300 rounded-md text-sm w-full"
          >
            <option value="">{headerLabels.service}</option>
            {getUniqueValues("service").map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Globe className="absolute left-2 top-2.5 w-4 h-4 text-orange-400" />
          <select
            value={filters.country}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, country: e.target.value }))
            }
            className="pl-8 pr-3 py-2 border border-orange-300 rounded-md text-sm w-full"
          >
            <option value="">{headerLabels.country}</option>
            {getUniqueValues("country").map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <UserCheck className="absolute left-2 top-2.5 w-4 h-4 text-orange-400" />
          <select
            value={filters.expert}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, expert: e.target.value }))
            }
            className="pl-8 pr-3 py-2 border border-orange-300 rounded-md text-sm w-full"
          >
            <option value="">{headerLabels.expert}</option>
            {getUniqueValues("expert").map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Send className="absolute left-2 top-2.5 w-4 h-4 text-orange-400" />
          <select
            value={filters.mode}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, mode: e.target.value }))
            }
            className="pl-8 pr-3 py-2 border border-orange-300 rounded-md text-sm w-full"
          >
            <option value="">{headerLabels.mode}</option>
            {getUniqueValues("mode").map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => {
            setQuery("");
            setFilters({
              status: "",
              service: "",
              country: "",
              expert: "",
              mode: "",
            });
          }}
          className="text-sm text-orange-600 hover:underline"
        >
          Clear All Filters
        </button>
      </div>

      <div className="overflow-auto max-h-[600px] min-h-[300px] border border-orange-300 rounded-lg">
        <table className="min-w-full divide-y divide-orange-200 text-sm">
          <thead className="bg-orange-100 text-orange-800 sticky top-0 z-10">
            <tr>
              {headers.map((key) => (
                <th
                  key={key}
                  className="px-4 py-2 border font-medium text-center text-orange-900 whitespace-nowrap"
                >
                  {headerLabels[key] || key}
                </th>
              ))}
              <th className="px-4 py-2 border text-xs font-semibold text-orange-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedRecords.length ? (
              paginatedRecords.map((record, index) => (
                <tr
                  key={index}
                  className="hover:bg-orange-50 border-b text-center"
                >
                  {headers.map((key) => (
                    <td
                      key={key}
                      className="px-3 py-2 border whitespace-nowrap"
                    >
                      {editingIndex === index &&
                      !nonEditableFields.includes(key) ? (
                        <input
                          type="text"
                          value={editedRecord[key] || ""}
                          onChange={(e) => handleChange(key, e.target.value)}
                          className="border rounded p-1 w-full text-xs"
                        />
                      ) : (
                        formatValue(key, record[key])
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2 border">
                    {editingIndex === index ? (
                      <button
                        onClick={() => handleSave(index)}
                        className="text-green-600 hover:underline text-xs"
                      >
                        Save
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEdit(index)}
                        className={`text-blue-600 hover:underline text-xs ${
                          !record.handlerId
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={!record.handlerId}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length + 1}
                  className="text-center text-gray-500 py-6"
                >
                  No records found from {visibleRecords.length} total records.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-orange-300 text-white rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages} &nbsp;
            <span className="text-xs text-orange-700">
              (showing {startRecord}–{endRecord} of {filteredRecords.length}{" "}
              filtered)
            </span>
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-orange-500 text-white rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerRecordList;
