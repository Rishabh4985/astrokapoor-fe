import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import { SellerContext } from "../../context/SellerContext";
import Excel from "../../components/shared/Excel";
import { toast } from "react-toastify";
import { Search, Calendar, Filter, Table2, PackageCheck, X } from "lucide-react";

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

const SellerSalesLookup = ({ onFilter }) => {
  const { allRecords, importSellerRecords } = useContext(SellerContext);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterValue, setFilterValue] = useState("");
  const [categoryKey, setCategoryKey] = useState("");
  const [categoryValue, setCategoryValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [category, setCategory] = useState("all");
  const itemsPerPage = 100;

  const getCurrentSellerEmail = useCallback(() => {
    const seller = JSON.parse(localStorage.getItem("currentSeller"));
    return seller?.email?.toLowerCase().trim();
  }, []);

  const sellerEmail = getCurrentSellerEmail();

  const flattenedRecords = useMemo(() => {
    if (!allRecords || !Array.isArray(allRecords)) return [];

    return allRecords.filter((record) => {
      const handler = record.handlerId?.toLowerCase().trim();
      return !handler || handler === sellerEmail;
    });
  }, [allRecords, sellerEmail]);

  const dynamicHeaders = useMemo(() => {
    return flattenedRecords.reduce((set, record) => {
      Object.keys(record).forEach((key) => set.add(key));
      return set;
    }, new Set(expectedHeaders));
  }, [flattenedRecords]);

  const headers = useMemo(() => {
    return Array.from(dynamicHeaders).filter(
      (key) => key.trim() !== "" && key !== "serialno"
    );
  }, [dynamicHeaders]);

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

  const formatValue = useCallback((key, value) => {
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
  }, []);

  const isRecordInDateRange = useCallback(
    (recordDateStr) => {
      if (!filterType || filterType === "all" || !filterValue) return true;
      const recordDate = new Date(recordDateStr);
      if (isNaN(recordDate)) return false;

      switch (filterType) {
        case "date": {
          const selected = new Date(filterValue);
          return (
            recordDate.getFullYear() === selected.getFullYear() &&
            recordDate.getMonth() === selected.getMonth() &&
            recordDate.getDate() === selected.getDate()
          );
        }
        case "week": {
          const [year, weekNumber] = filterValue.split("-W");
          const firstDayOfYear = new Date(year, 0, 1);
          const days = (parseInt(weekNumber) - 1) * 7;
          const weekStart = new Date(
            firstDayOfYear.setDate(firstDayOfYear.getDate() + days)
          );
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return recordDate >= weekStart && recordDate <= weekEnd;
        }
        case "month": {
          const [year, month] = filterValue.split("-");
          return (
            recordDate.getFullYear() === parseInt(year) &&
            recordDate.getMonth() === parseInt(month) - 1
          );
        }
        case "year":
          return recordDate.getFullYear() === parseInt(filterValue);
        default:
          return true;
      }
    },
    [filterType, filterValue]
  );

  const filteredRecords = useMemo(() => {
    return flattenedRecords.filter((record) => {
      const matchesQuery = Object.values(record).some((val) =>
        String(val || "")
          .toLowerCase()
          .includes(query.toLowerCase())
      );
      const matchesDate = isRecordInDateRange(record.dateOfPayment);

      const matchesCategory =
        category === "all" ? true : record.category === category;

      const matchesExtraCategory =
        !categoryKey || !categoryValue
          ? true
          : String(record[categoryKey] || "").toLowerCase() ===
            categoryValue.toLowerCase();

      return (
        matchesQuery && matchesDate && matchesCategory && matchesExtraCategory
      );
    });
  }, [
    flattenedRecords,
    query,
    category,
    categoryKey,
    categoryValue,
    isRecordInDateRange,
  ]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, categoryKey, categoryValue, category]);

  const handleImport = useCallback(
    (importedData) => {
      importSellerRecords(importedData);
      toast.success("Records imported successfully!");
    },
    [importSellerRecords]
  );

  const handleExport = useCallback(() => {
    toast.success(`Exporting ${filteredRecords.length} filtered records`);
    return filteredRecords;
  }, [filteredRecords]);

  useEffect(() => {
    if (onFilter) onFilter(filteredRecords);
  }, [filteredRecords, onFilter]);

  const getCategoryOptions = useMemo(() => {
    if (!categoryKey || !flattenedRecords.length) return [];
    return [
      ...new Set(
        flattenedRecords
          .map((r) => r[categoryKey])
          .filter((v) => v !== undefined && v !== null && v !== "")
      ),
    ].sort();
  }, [flattenedRecords, categoryKey]);

  const clearAllFilters = () => {
    setQuery("");
    setFilterType("all");
    setFilterValue("");
    setCategoryKey("");
    setCategoryValue("");
    setCategory("all");
  };

  const hasActiveFilters = query || filterType !== "all" || categoryKey || category !== "all";

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-lg border border-orange-100">
        {/* Header Section */}
        <div className="p-4 sm:p-6 border-b border-orange-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-orange-800 flex items-center gap-2">
                <Table2 className="w-5 h-5 sm:w-6 sm:h-6" /> 
                Seller Sales Lookup
              </h2>
              <p className="text-sm text-orange-600">
                {filteredRecords.length} of {flattenedRecords.length} records
              </p>
            </div>
            <div className="shrink-0">
              <Excel onImport={handleImport} onExport={handleExport} />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-orange-50/50 border-b border-orange-200">
          <div className="space-y-4">
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-600 w-4 h-4" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-orange-300 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                placeholder="Search across all records..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Date Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-orange-700">
                  <Calendar className="w-4 h-4" />
                  Date Filter
                </label>
                <select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setFilterValue("");
                  }}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="all">All Dates</option>
                  <option value="date">By Date</option>
                  <option value="week">By Week</option>
                  <option value="month">By Month</option>
                  <option value="year">By Year</option>
                </select>
                
                {filterType === "date" && (
                  <input
                    type="date"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 bg-white mt-2"
                  />
                )}

                {filterType === "week" && (
                  <input
                    type="week"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 bg-white mt-2"
                  />
                )}

                {filterType === "month" && (
                  <input
                    type="month"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 bg-white mt-2"
                  />
                )}

                {filterType === "year" && (
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 bg-white mt-2"
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: 15 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-orange-700">
                  <PackageCheck className="w-4 h-4" />
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="all">All Categories</option>
                  <option value="Gemstones">Gemstones</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Products">Products</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-orange-700">
                  <Filter className="w-4 h-4" />
                  Filter Type
                </label>
                <select
                  value={categoryKey}
                  onChange={(e) => {
                    setCategoryKey(e.target.value);
                    setCategoryValue("");
                  }}
                  className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">Select Filter</option>
                  <option value="status">Status</option>
                  <option value="service">Service</option>
                  <option value="handleBy">Handled By</option>
                  <option value="mode">Mode</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-orange-700">
                  Filter Value
                </label>
                {categoryKey ? (
                  <select
                    value={categoryValue}
                    onChange={(e) => setCategoryValue(e.target.value)}
                    className="w-full px-3 py-2 border border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="">Select {categoryKey}</option>
                    {getCategoryOptions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm bg-gray-100 text-gray-500 flex items-center justify-center">
                    Select filter type first
                  </div>
                )}
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table Section */}
        <div className="p-4 sm:p-6">
          <div className="overflow-auto max-h-[60vh] min-h-[300px] rounded-lg border border-orange-200">
            <table className="min-w-full divide-y divide-orange-200 text-sm">
              <thead className="bg-orange-100 text-orange-800 sticky top-0 z-10">
                <tr>
                  {headers.map((key) => (
                    <th
                      key={key}
                      className="px-3 py-3 sm:px-4 sm:py-4 font-medium whitespace-nowrap text-center border-r border-orange-200 last:border-r-0"
                    >
                      {headerLabels[key] || key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((rec, i) => (
                    <tr
                      key={i}
                      className={`hover:bg-orange-50 transition-colors ${
                        i % 2 === 0 ? "bg-white" : "bg-orange-25"
                      }`}
                    >
                      {headers.map((key) => (
                        <td
                          className="px-3 py-3 sm:px-4 sm:py-4 border-r border-orange-100 last:border-r-0 whitespace-nowrap text-center text-xs sm:text-sm"
                          key={key}
                        >
                          {formatValue(key, rec[key])}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={headers.length}
                      className="text-center py-8 text-gray-500"
                    >
                      <div className="space-y-2">
                        <div className="text-lg font-medium">No matching records found</div>
                        <div className="text-sm">
                          Try adjusting your search criteria or clear filters
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-700 text-center sm:text-left">
                Showing {paginatedRecords.length} of {filteredRecords.length} filtered records
                <span className="hidden sm:inline"> (Page {currentPage} of {totalPages})</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-orange-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors text-sm"
                >
                  Previous
                </button>
                
                <div className="px-3 py-2 bg-white border border-orange-300 rounded-lg text-sm min-w-[80px] text-center">
                  {currentPage} / {totalPages}
                </div>
                
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3 py-2 bg-orange-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerSalesLookup;