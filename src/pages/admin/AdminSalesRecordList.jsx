// import React, {
//   useState,
//   useEffect,
//   useContext,
//   useMemo,
//   useCallback,
// } from "react";
// import { AdminContext } from "../../context/AdminContext";
// import Excel from "../../components/shared/Excel";
// import { toast } from "react-toastify";
// import { Search, Calendar, Filter, Tags, Table2 } from "lucide-react";

// const AdminSalesRecordList = ({ onFilter }) => {
//   const { allRecords, setRecords } = useContext(AdminContext);
//   const [query, setQuery] = useState("");
//   const [filterType, setFilterType] = useState("all");
//   const [filterValue, setFilterValue] = useState("");
//   const [categoryFilter, setCategoryFilter] = useState("all");
//   const [selectedCategory, setSelectedCategory] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);

//   const itemsPerPage = 100;

//   const flattenedRecords = useMemo(() => {
//     if (!allRecords || allRecords.length === 0) return [];

//     if (allRecords.length > 0 && !allRecords[0]?.records) {
//       return allRecords;
//     }

//     return allRecords.flatMap((user) => {
//       if (!user.records && !user.userData) return [user];

//       return user.records.map((record) => ({
//         ...record,
//         customerName: user.userData?.customerName || "",
//         email1: user.userData?.email1 || "",
//         email2: user.userData?.email2 || "",
//         mobile1: user.userData?.mobile1 || "",
//         mobile2: user.userData?.mobile2 || "",
//       }));
//     });
//   }, [allRecords]);

//   const expectedHeaders = [
//     "dateOfPayment",
//     "customerName",
//     "amount",
//     "pendingAmount",
//     "refund",
//     "status",
//     "service",
//     "mobile1",
//     "mobile2",
//     "email1",
//     "email2",
//     "expert",
//     "handlerId",
//     "handleBy",
//     "mode",
//     "country",
//     "state",
//     "transactionId",
//     "sheet",
//     "remark",
//     "gems",
//     "gems1",
//     "gems2",
//     "gems3",
//     "gems4",
//     "communication",
//     "solutions",
//     "solDetails",
//     "overallRating",
//     "remarks",
//     "qualityDesc",
//     "feedStatus",
//     "additionalInfo",
//     "feedbackComment",
//     "address",
//     "airBillNo",
//     "productsName",
//     "skuNo",
//     "category",
//   ];

//   const dynamicHeaders = flattenedRecords.reduce((set, record) => {
//     Object.keys(record).forEach((key) => set.add(key));
//     return set;
//   }, new Set(expectedHeaders));

//   const headers = Array.from(dynamicHeaders).filter(
//     (key) => key.trim() !== "" && key !== "serialno"
//   );

//   const headerLabels = {
//     customerName: "Customer Name",
//     email1: "Email-1",
//     email2: "Email-2",
//     dateOfPayment: "Date of Payment",
//     amount: "Amount",
//     service: "Service",
//     status: "Status",
//     mobile1: "Mobile-1",
//     mobile2: "Mobile-2",
//     country: "Country",
//     state: "State",
//     transactionId: "Transaction ID",
//     pendingAmount: "Pending Amount",
//     refund: "Refund",
//     handlerId: "Handler ID",
//     handleBy: "Handled By",
//     mode: "Mode",
//     expert: "Expert",
//     sheet: "Sheet",
//     remark: "Remark",
//     gems: "Gems",
//     gems1: "Gem-1",
//     gems2: "Gem-2",
//     gems3: "Gem-3",
//     gems4: "Gem-4",
//     communication: "Communication",
//     solutions: "Solutions",
//     solDetails: "Solution Details",
//     overallRating: "Overall Rating",
//     remarks: "Remark",
//     qualityDesc: "Quality Description",
//     feedStatus: "Feed Status",
//     additionalInfo: "Additional Info",
//     feedbackComment: "Feedback Comment",
//     address: "Address",
//     airBillNo: "Air Bill Number",
//     productsName: "Product Name",
//     skuNo: "SKU NO",
//     category: "Category",
//   };

//   const formatValue = (key, value) => {
//     if (value === null || value === undefined || value === "") return "-";

//     if (typeof value === "object") {
//       if (value?.seconds) {
//         const date = new Date(value.seconds * 1000);
//         return date.toLocaleDateString("en-GB");
//       }
//       if (value instanceof Date) {
//         return value.toLocaleDateString("en-GB");
//       }
//       if (value.label) return value.label;
//       return JSON.stringify(value);
//     }

//     if (
//       key.toLowerCase().includes("date") &&
//       typeof value === "string" &&
//       /^\d{4}-\d{2}-\d{2}$/.test(value)
//     ) {
//       const [year, month, day] = value.split("-");
//       return `${day}/${month}/${year}`;
//     }

//     return value;
//   };

//   const isRecordInDateRange = useCallback(
//     (recordDateStr) => {
//       if (!filterType || filterType === "all" || !filterValue) return true;
//       const recordDate = new Date(recordDateStr);
//       if (isNaN(recordDate)) return false;

//       switch (filterType) {
//         case "date": {
//           const selected = new Date(filterValue);
//           return (
//             recordDate.getFullYear() === selected.getFullYear() &&
//             recordDate.getMonth() === selected.getMonth() &&
//             recordDate.getDate() === selected.getDate()
//           );
//         }
//         case "week": {
//           const [year, weekNumber] = filterValue.split("-W");
//           const firstDayOfYear = new Date(year, 0, 1);
//           const days = (parseInt(weekNumber) - 1) * 7;
//           const weekStart = new Date(
//             firstDayOfYear.setDate(firstDayOfYear.getDate() + days)
//           );
//           const weekEnd = new Date(weekStart);
//           weekEnd.setDate(weekStart.getDate() + 6);
//           return recordDate >= weekStart && recordDate <= weekEnd;
//         }
//         case "month": {
//           const [year, month] = filterValue.split("-");
//           return (
//             recordDate.getFullYear() === parseInt(year) &&
//             recordDate.getMonth() === parseInt(month) - 1
//           );
//         }
//         case "year":
//           return recordDate.getFullYear() === parseInt(filterValue);
//         default:
//           return true;
//       }
//     },
//     [filterType, filterValue]
//   );

//   const filteredRecords = useMemo(() => {
//     return flattenedRecords.filter((record) => {
//       const matchesQuery = Object.values(record).some((val) =>
//         String(val || "")
//           .toLowerCase()
//           .includes(query.toLowerCase())
//       );
//       const matchesDate = isRecordInDateRange(record.dateOfPayment);
//       const matchesCategory =
//         categoryFilter === "all" || selectedCategory === ""
//           ? true
//           : String(record[categoryFilter] || "").toLowerCase() ===
//             selectedCategory.toLowerCase();
//       return matchesQuery && matchesDate && matchesCategory;
//     });
//   }, [
//     flattenedRecords,
//     query,
//     categoryFilter,
//     selectedCategory,
//     isRecordInDateRange,
//   ]);

//   const totalPagesCalc = Math.ceil(filteredRecords.length / itemsPerPage);
//   const currentPageRecords = useMemo(() => {
//     const start = (currentPage - 1) * itemsPerPage;
//     return filteredRecords.slice(start, start + itemsPerPage);
//   }, [filteredRecords, currentPage, itemsPerPage]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [query, filterType, filterValue, categoryFilter, selectedCategory]);

//   const handleImport = (importedData) => {
//     setRecords(importedData);
//     toast.success("Records imported successfully!");
//   };

//   const handleExport = () => {
//     toast.success(`Exporting ${filteredRecords.length} filtered records`);
//     return filteredRecords;
//   };

//   useEffect(() => {
//     if (onFilter) onFilter(filteredRecords);
//   }, [filteredRecords, onFilter]);

//   return (
//     <div className="p-6 bg-white rounded-2xl shadow-lg mb-8 border border-orange-100">
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
//         <h2 className="text-2xl font-bold text-orange-800 flex items-center gap-2">
//           <Table2 className="w-6 h-6" /> Admin Sales RecordList
//           <span className="text-sm font-normal text-orange-600">
//             ({filteredRecords.length} of {flattenedRecords.length} records)
//           </span>
//         </h2>
//         <Excel onImport={handleImport} onExport={handleExport} />
//       </div>

//       <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap gap-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 w-4 h-4" />
//             <input
//               type="text"
//               placeholder="Search across all records..."
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               className="w-full pl-9 pr-3 py-2 rounded-lg border border-orange-300 text-sm focus:ring-2 focus:ring-orange-400"
//             />
//           </div>

//           <div className="relative">
//             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 w-4 h-4" />
//             <select
//               value={filterType}
//               onChange={(e) => {
//                 setFilterType(e.target.value);
//                 setFilterValue("");
//               }}
//               className="w-full pl-9 pr-3 py-2 rounded-lg border border-orange-300 text-sm focus:ring-2 focus:ring-orange-400"
//             >
//               <option value="all">All Dates</option>
//               <option value="date">By Date</option>
//               <option value="week">By Week</option>
//               <option value="month">By Month</option>
//               <option value="year">By Year</option>
//             </select>
//           </div>

//           {["date", "week", "month"].includes(filterType) && (
//             <div className="relative">
//               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 w-4 h-4" />
//               <input
//                 type={filterType}
//                 value={filterValue}
//                 onChange={(e) => setFilterValue(e.target.value)}
//                 className="w-full pl-9 pr-3 py-2 rounded-lg border border-orange-300 text-sm focus:ring-2 focus:ring-orange-400"
//               />
//             </div>
//           )}

//           {filterType === "year" && (
//             <div className="relative">
//               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 w-4 h-4" />
//               <select
//                 value={filterValue}
//                 onChange={(e) => setFilterValue(e.target.value)}
//                 className="w-full pl-9 pr-3 py-2 rounded-lg border border-orange-300 text-sm focus:ring-2 focus:ring-orange-400"
//               >
//                 <option value="">Select Year</option>
//                 {Array.from(
//                   { length: new Date().getFullYear() - 1969 },
//                   (_, i) => {
//                     const year = new Date().getFullYear() - i;
//                     return (
//                       <option key={year} value={year}>
//                         {year}
//                       </option>
//                     );
//                   }
//                 )}
//               </select>
//             </div>
//           )}

//           <div className="relative">
//             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 w-4 h-4" />
//             <select
//               value={categoryFilter}
//               onChange={(e) => {
//                 setCategoryFilter(e.target.value);
//                 setSelectedCategory("");
//               }}
//               className="w-full pl-9 pr-3 py-2 rounded-lg border border-orange-300 text-sm focus:ring-2 focus:ring-orange-400"
//             >
//               <option value="all">All Categories</option>
//               <option value="status">Status</option>
//               <option value="service">Service</option>
//               <option value="handleBy">Handled By</option>
//               <option value="mode">Mode</option>
//               <option value="expert">Expert</option>
//             </select>
//           </div>

//           {categoryFilter !== "all" && (
//             <div className="relative">
//               <Tags className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 w-4 h-4" />
//               <select
//                 value={selectedCategory}
//                 onChange={(e) => setSelectedCategory(e.target.value)}
//                 className="w-full pl-9 pr-3 py-2 rounded-lg border border-orange-300 text-sm focus:ring-2 focus:ring-orange-400"
//               >
//                 <option value="">Select {categoryFilter}</option>
//                 {[
//                   ...new Set(
//                     flattenedRecords
//                       .map((r) => r[categoryFilter])
//                       .filter(Boolean)
//                   ),
//                 ].map((cat) => (
//                   <option key={cat} value={cat}>
//                     {cat}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="relative">
//         <div className="overflow-auto max-h-[500px] min-h-[300px] rounded-lg border border-orange-300">
//           <table className="min-w-full divide-y divide-orange-200 text-sm">
//             <thead className="bg-orange-100 text-orange-800 sticky top-0 z-10">
//               <tr>
//                 {headers.map((key) => (
//                   <th
//                     key={key}
//                     className="px-4 py-2 font-medium whitespace-nowrap text-center border-r border-orange-200"
//                   >
//                     {headerLabels[key] || key}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {currentPageRecords.length > 0 ? (
//                 currentPageRecords.map((record, idx) => (
//                   <tr
//                     key={idx}
//                     className={
//                       idx % 2 === 0
//                         ? "bg-white"
//                         : "bg-orange-50 hover:bg-orange-100"
//                     }
//                   >
//                     {headers.map((key) => (
//                       <td
//                         key={key}
//                         className="px-4 py-2 border-r border-orange-100 whitespace-nowrap text-center"
//                         title={record[key]}
//                       >
//                         {formatValue(key, record[key])}
//                       </td>
//                     ))}
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td
//                     colSpan={headers.length}
//                     className="text-center text-gray-500 py-6"
//                   >
//                     No matching records found from {flattenedRecords.length}{" "}
//                     total records.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         <div className="sticky bottom-0 bg-white flex justify-center items-center gap-4 py-2 border-t border-orange-300 z-10">
//           <button
//             onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//             disabled={currentPage <= 1}
//             className="px-4 py-2 rounded bg-orange-300 text-white font-semibold disabled:opacity-50 hover:bg-orange-400 transition"
//           >
//             Previous
//           </button>
//           <span className="flex items-center px-2 font-semibold text-orange-700">
//             Page {currentPage} of {totalPagesCalc}
//             <span className="text-sm ml-2 text-orange-600">
//               {(() => {
//                 const startIndex = (currentPage - 1) * itemsPerPage + 1;
//                 const endIndex = Math.min(
//                   currentPage * itemsPerPage,
//                   filteredRecords.length
//                 );
//                 return `(showing ${startIndex} to ${endIndex} of ${filteredRecords.length} filtered)`;
//               })()}
//             </span>
//           </span>
//           <button
//             onClick={() =>
//               setCurrentPage((prev) => Math.min(prev + 1, totalPagesCalc))
//             }
//             disabled={currentPage >= totalPagesCalc}
//             className="px-4 py-2 rounded bg-orange-500 text-white font-semibold disabled:opacity-50 hover:bg-orange-600 transition"
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AdminSalesRecordList;



import React, {
  useState,
  useEffect,
  useContext,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { AdminContext } from "../../context/AdminContext";
import Excel from "../../components/shared/Excel";
import { toast } from "react-toastify";
import { Search, Calendar, Filter, Tags, Table2 } from "lucide-react";

const AdminSalesRecordList = ({ onFilter }) => {
  const { allRecords, setRecords } = useContext(AdminContext);

  // Search state
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Date filter state
  const [filterType, setFilterType] = useState("all");
  const [filterValue, setFilterValue] = useState("");

  // Category filter state
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Debounce timer ref
  const debounceTimer = useRef(null);

  // ============================================
  // OPTIMIZATION 1: Debounce search input
  // ============================================
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
      setCurrentPage(1); // Reset pagination on new search
    }, 300); // 300ms debounce delay

    // Cleanup on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  // ============================================
  // OPTIMIZATION 2: Memoized flattened records
  // ============================================
  const flattenedRecords = useMemo(() => {
    if (!allRecords || allRecords.length === 0) return [];

    // Check if records are already flat
    if (allRecords.length > 0 && !allRecords[0]?.records) {
      return allRecords;
    }

    // Flatten nested structure and add user data
    return allRecords.flatMap((user) => {
      const records = user.records || [];
      if (records.length === 0) return [user];

      return records.map((record) => ({
        ...record,
        customerName: user.userData?.customerName || "",
        email1: user.userData?.email1 || "",
        email2: user.userData?.email2 || "",
        mobile1: user.userData?.mobile1 || "",
        mobile2: user.userData?.mobile2 || "",
      }));
    });
  }, [allRecords]);

  // ============================================
  // OPTIMIZATION 3: Static expected headers
  // ============================================
  const expectedHeaders = useMemo(
    () => [
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
    ],
    []
  );

  // ============================================
  // OPTIMIZATION 4: Memoized headers generation
  // ============================================
  const headers = useMemo(() => {
    if (flattenedRecords.length === 0) return expectedHeaders;

    const dynamicHeadersSet = new Set(expectedHeaders);
    flattenedRecords.forEach((record) => {
      Object.keys(record).forEach((key) => {
        if (key.trim() !== "" && key !== "serialno") {
          dynamicHeadersSet.add(key);
        }
      });
    });

    return Array.from(dynamicHeadersSet);
  }, [flattenedRecords, expectedHeaders]);

  // ============================================
  // Header labels mapping (static)
  // ============================================
  const headerLabels = useMemo(
    () => ({
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
    }),
    []
  );

  // ============================================
  // OPTIMIZATION 5: Memoized value formatter
  // ============================================
  const formatValue = useCallback((key, value) => {
    if (value === null || value === undefined || value === "") return "-";

    // Handle object types
    if (typeof value === "object") {
      // Firestore timestamp
      if (value?.seconds) {
        const date = new Date(value.seconds * 1000);
        return date.toLocaleDateString("en-GB");
      }
      // JavaScript Date
      if (value instanceof Date) {
        return value.toLocaleDateString("en-GB");
      }
      // Objects with label property
      if (value.label) return value.label;
      // Default JSON stringify
      return JSON.stringify(value);
    }

    // Format date strings (YYYY-MM-DD format)
    if (
      key.toLowerCase().includes("date") &&
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
      const [year, month, day] = value.split("-");
      return `${day}/${month}/${year}`;
    }

    return String(value);
  }, []);

  // ============================================
  // OPTIMIZATION 6: Memoized date range checker
  // ============================================
  const isRecordInDateRange = useCallback((recordDateStr) => {
    if (!filterType || filterType === "all" || !filterValue) return true;

    const recordDate = new Date(recordDateStr);
    if (isNaN(recordDate.getTime())) return false;

    try {
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
          if (!year || !weekNumber) return true;

          const yearNum = parseInt(year);
          const weekNum = parseInt(weekNumber);

          // Calculate week start date safely (don't mutate)
          const firstDay = new Date(yearNum, 0, 1);
          const daysOffset = (weekNum - 1) * 7;
          const weekStart = new Date(firstDay);
          weekStart.setDate(firstDay.getDate() + daysOffset);

          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);

          return recordDate >= weekStart && recordDate <= weekEnd;
        }
        case "month": {
          const [year, month] = filterValue.split("-");
          if (!year || !month) return true;

          return (
            recordDate.getFullYear() === parseInt(year) &&
            recordDate.getMonth() === parseInt(month) - 1
          );
        }
        case "year": {
          const yearNum = parseInt(filterValue);
          if (isNaN(yearNum)) return true;
          return recordDate.getFullYear() === yearNum;
        }
        default:
          return true;
      }
    } catch (error) {
      console.error("Date filtering error:", error);
      return true; // Return true on error to show record
    }
  }, [filterType, filterValue]);

  // ============================================
  // OPTIMIZATION 7: Memoized unique values getter
  // ============================================
  const getUniqueValues = useCallback(
    (fieldName) => {
      if (flattenedRecords.length === 0) return [];

      const uniqueSet = new Set();
      flattenedRecords.forEach((record) => {
        const value = record[fieldName];
        if (value !== null && value !== undefined && value !== "") {
          uniqueSet.add(String(value).trim());
        }
      });

      return Array.from(uniqueSet).sort();
    },
    [flattenedRecords]
  );

  // ============================================
  // OPTIMIZATION 8: Main filtering logic
  // ============================================
  const filteredRecords = useMemo(() => {
    return flattenedRecords.filter((record) => {
      // Match search query
      const matchesQuery =
        debouncedQuery === "" ||
        Object.values(record).some((val) =>
          String(val || "")
            .toLowerCase()
            .includes(debouncedQuery.toLowerCase())
        );

      // Match date range
      const matchesDate = isRecordInDateRange(record.dateOfPayment);

      // Match category filter
      const matchesCategory =
        categoryFilter === "all" ||
        selectedCategory === "" ||
        String(record[categoryFilter] || "")
          .toLowerCase()
          .trim() === selectedCategory.toLowerCase().trim();

      return matchesQuery && matchesDate && matchesCategory;
    });
  }, [flattenedRecords, debouncedQuery, categoryFilter, selectedCategory, isRecordInDateRange]);

  // ============================================
  // OPTIMIZATION 9: Pagination calculations
  // ============================================
  const totalPages = useMemo(() => {
    return Math.ceil(filteredRecords.length / itemsPerPage);
  }, [filteredRecords.length]);

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredRecords.slice(start, end);
  }, [filteredRecords, currentPage]);

  // ============================================
  // Reset pagination on filter change
  // ============================================
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, filterType, filterValue, categoryFilter, selectedCategory]);

  // ============================================
  // Handlers
  // ============================================
  const handleImport = useCallback((importedData) => {
    setRecords(importedData);
    toast.success("Records imported successfully!");
  }, [setRecords]);

  const handleExport = useCallback(() => {
    toast.success(`Exporting ${filteredRecords.length} filtered records`);
    return filteredRecords;
  }, [filteredRecords]);

  // ============================================
  // Notify parent of filtered records
  // ============================================
  useEffect(() => {
    if (onFilter && typeof onFilter === "function") {
      onFilter(filteredRecords);
    }
  }, [filteredRecords, onFilter]);

  // ============================================
  // Pagination handlers
  // ============================================
  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  // ============================================
  // Render
  // ============================================
  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg mb-8 border border-orange-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-orange-800 flex items-center gap-2">
          <Table2 className="w-6 h-6" /> Admin Sales RecordList
          <span className="text-sm font-normal text-orange-600">
            ({filteredRecords.length} of {flattenedRecords.length} records)
          </span>
        </h2>
        <Excel onImport={handleImport} onExport={handleExport} />
      </div>

      {/* Filters Section */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-wrap gap-4">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 w-4 h-4" />
            <input
              type="text"
              placeholder="Search across all records..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-orange-300 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 hover:text-orange-600"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Date Filter Type */}
          <div className="relative min-w-[150px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 w-4 h-4" />
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setFilterValue("");
              }}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-orange-300 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
            >
              <option value="all">All Dates</option>
              <option value="date">By Date</option>
              <option value="week">By Week</option>
              <option value="month">By Month</option>
              <option value="year">By Year</option>
            </select>
          </div>

          {/* Date/Week/Month Input */}
          {["date", "week", "month"].includes(filterType) && (
            <div className="relative min-w-[150px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 w-4 h-4" />
              <input
                type={filterType === "week" ? "week" : filterType}
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-orange-300 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
              />
            </div>
          )}

          {/* Year Selector */}
          {filterType === "year" && (
            <div className="relative min-w-[150px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 w-4 h-4" />
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-orange-300 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
              >
                <option value="">Select Year</option>
                {Array.from(
                  { length: new Date().getFullYear() - 1969 },
                  (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  }
                )}
              </select>
            </div>
          )}

          {/* Category Filter Type */}
          <div className="relative min-w-[150px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 w-4 h-4" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setSelectedCategory("");
              }}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-orange-300 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
            >
              <option value="all">All Categories</option>
              <option value="status">Status</option>
              <option value="service">Service</option>
              <option value="handleBy">Handled By</option>
              <option value="mode">Mode</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          {/* Category Value Selector */}
          {categoryFilter !== "all" && (
            <div className="relative min-w-[150px]">
              <Tags className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-orange-300 text-sm focus:ring-2 focus:ring-orange-400 focus:outline-none transition"
              >
                <option value="">Select {categoryFilter}</option>
                {getUniqueValues(categoryFilter).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="relative">
        <div className="overflow-auto max-h-[500px] min-h-[300px] rounded-lg border border-orange-300">
          <table className="min-w-full divide-y divide-orange-200 text-sm">
            {/* Table Head */}
            <thead className="bg-orange-100 text-orange-800 sticky top-0 z-10">
              <tr>
                {headers.map((key) => (
                  <th
                    key={key}
                    className="px-4 py-2 font-medium whitespace-nowrap text-center border-r border-orange-200 bg-orange-100"
                  >
                    {headerLabels[key] || key}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((record, idx) => (
                  <tr
                    key={`${record._id || idx}`}
                    className={
                      idx % 2 === 0
                        ? "bg-white hover:bg-orange-50"
                        : "bg-orange-50 hover:bg-orange-100"
                    }
                  >
                    {headers.map((key) => (
                      <td
                        key={`${record._id}-${key}`}
                        className="px-4 py-2 border-r border-orange-100 whitespace-nowrap text-center text-xs sm:text-sm"
                        title={String(record[key] || "")}
                      >
                        {formatValue(key, record[key])}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="text-center text-gray-500 py-6 text-sm"
                  >
                    No matching records found from {flattenedRecords.length} total
                    records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="sticky bottom-0 bg-white flex flex-col sm:flex-row justify-center items-center gap-4 py-3 px-2 border-t border-orange-300 z-10">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage <= 1}
            className="px-4 py-2 rounded bg-orange-300 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-400 transition"
            aria-label="Previous page"
          >
            Previous
          </button>

          <span className="flex flex-col sm:flex-row items-center gap-2 text-sm sm:text-base font-semibold text-orange-700">
            Page <span className="font-bold text-lg">{currentPage}</span> of{" "}
            <span className="font-bold text-lg">{totalPages}</span>
            <span className="text-xs text-orange-600 whitespace-nowrap">
              (showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of{" "}
              {filteredRecords.length} filtered)
            </span>
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 rounded bg-orange-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSalesRecordList;

