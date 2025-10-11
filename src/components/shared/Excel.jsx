import React, { useContext } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { AdminContext } from "../../context/AdminContext";
import { SellerContext } from "../../context/SellerContext";
import { useAuth } from "../../context/AuthContext";
import { Upload, FileDown } from "lucide-react";
import axios from "axios";

const Excel = ({ onImport, onExport }) => {
  const { currentSeller, isAdmin } = useAuth();
  const adminContext = useContext(AdminContext);
  const sellerContext = useContext(SellerContext);

  const headerMap = {
    Date: "dateOfPayment",
    "Client Name": "customerName",
    Amount: "amount",
    "Pending Amount": "pendingAmount",
    Refund: "refund",
    Status: "status",
    Service: "service",
    "Mobile 1": "mobile1",
    "Mobile 2": "mobile2",
    "Email 1": "email1",
    "Email 2": "email2",
    Expert: "expert",
    "Handler ID": "handlerId",
    "Handle By": "handleBy",
    Mode: "mode",
    Country: "country",
    State: "state",
    "Transaction ID": "transactionId",
    Sheet: "sheet",
    Remark: "remark",
    Gems: "gems",
    "Gems 1": "gems1",
    "Gems 2": "gems2",
    "Gems 3": "gems3",
    "Gems 4": "gems4",
    Communication: "communication",
    Solutions: "solutions",
    "Sol Details": "solDetails",
    "Overall Rating": "overallRating",
    Remarks: "remarks",
    "Quality Desc": "qualityDesc",
    "Feed Status": "feedStatus",
    "Additional Info": "additionalInfo",
    "Feedback Comment": "feedbackComment",
    Address: "address",
    "Air bill no.": "airBillNo",
    "Products Name": "productsName",
    "SKU NO": "skuNo",
    Category: "category",
  };

  const normalizeService = (value) => {
    const val = (value || "").toString().trim().toLowerCase();
    if (val.includes("Consultation")) return "Consultation";
    if (val.includes("Products")) return "Products";
    if (val.includes("Gemstones")) return "Gemstones";

    return value;
  };

  const uploadRecordsToBackend = async (records) => {
    const chunkSize = 100; // smaller chunks are safer
    const token = localStorage.getItem("authToken");

    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      try {
        await axios.post(
          "/api/admin/import-records",
          { records: chunk },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.info(`Uploaded records ${i + 1} to ${i + chunk.length}`);
      } catch (err) {
        console.error("Chunk upload failed:", err);
        toast.error(`Failed to upload records ${i + 1} to ${i + chunk.length}`);
        throw err;
      }
    }

    toast.success("All records uploaded successfully!");
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const allRecords = [];
    let filesProcessed = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          const workbook = XLSX.read(bstr, { type: "binary" });

          workbook.SheetNames.forEach((sheetName) => {
            const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
              header: 1,
              defval: "",
            });

            const rawHeaders = sheet[0];
            if (!rawHeaders) return;

            const headers = rawHeaders.map(
              (h) =>
                headerMap[h.trim()] ||
                h.trim().replace(/\s+/g, "").toLowerCase()
            );

            const records = sheet.slice(1).map((row) => {
              const obj = {};
              headers.forEach((key, idx) => {
                let value = row[idx] ?? "";

                if (key === "dateOfPayment") {
                  if (typeof value === "number") {
                    const parsed = XLSX.SSF.parse_date_code(value);
                    value = parsed
                      ? new Date(parsed.y, parsed.m - 1, parsed.d)
                      : "";
                  } else if (typeof value === "string") {
                    if (value.includes("/")) {
                      const [day, month, year] = value.split("/");
                      const parsed = new Date(`${year}-${month}-${day}`);
                      value = isNaN(parsed) ? "" : parsed;
                    } else {
                      const parsed = new Date(value);
                      value = isNaN(parsed) ? "" : parsed;
                    }
                  } else {
                    const parsed = new Date(value);
                    value = isNaN(parsed) ? "" : parsed;
                  }
                }

                if (["amount", "pendingAmount", "refund"].includes(key)) {
                  const parsed = parseFloat(value);
                  value = isNaN(parsed) ? 0 : parsed;
                }

                if (key === "service") {
                  value = normalizeService(value);
                }
                obj[key] = value;
              });
              if (!obj.category || obj.category.trim() === "") {
                obj.category = sheetName;
              }
              return obj;
            });

            allRecords.push(...records);
          });

          filesProcessed++;

          if (filesProcessed === files.length) {
            const sortedRecords = allRecords.sort((a, b) => {
              const dateA = new Date(a.dateOfPayment || 0);
              const dateB = new Date(b.dateOfPayment || 0);
              return dateB - dateA;
            });
            if (onImport) onImport(sortedRecords);

            if (isAdmin && adminContext?.importRecords) {
              adminContext.importRecords(sortedRecords);
            } else if (currentSeller && sellerContext?.importSellerRecords) {
              const sellerEmail = currentSeller.email.toLowerCase().trim();

              const sellerRecords = sortedRecords.filter((record) => {
                const handler = (record.handlerId || "")
                  .toString()
                  .toLowerCase()
                  .trim();
                return !handler || handler === sellerEmail;
              });

              if (sellerRecords.length === 0) {
                toast.warn(
                  "No valid records found for your account in the uploaded file."
                );
                return;
              }

              sellerContext.importSellerRecords(sellerRecords);
            }

            // sessionStorage.setItem("userList", JSON.stringify(sortedRecords));
            toast.success("Excel imported successfully!");
            uploadRecordsToBackend(sortedRecords);
          }
        } catch (err) {
          toast.error("Error reading Excel file.");
          console.error(err);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  const handleExportClick = () => {
    try {
      const records = onExport();

      const categories = ["Consultation", "Products", "Gemstones"];

      const reverseHeaderMap = Object.entries(headerMap).reduce(
        (acc, [excelHeader, fieldName]) => {
          acc[fieldName] = excelHeader;
          return acc;
        },
        {}
      );

      const filterAndMapRecords = (category) => {
        return records
          .filter((record) => record.category === category)
          .map((record) => {
            const mapped = {};
            Object.entries(record).forEach(([key, value]) => {
              const excelKey = reverseHeaderMap[key] || key;
              mapped[excelKey] = value;
            });
            return mapped;
          });
      };

      const workbook = XLSX.utils.book_new();

      categories.forEach((category) => {
        const data = filterAndMapRecords(category);
        if (data.length > 0) {
          const worksheet = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(workbook, worksheet, category);
        }
      });

      XLSX.writeFile(workbook, "sales_data.xlsx");
      toast.success("Excel exported successfully with three category sheets!");
    } catch (err) {
      toast.error("Failed to export Excel.");
      console.error(err);
    }
  };

  return (
    <div className="flex flex-wrap gap-4 mt-4">
      <label className="flex items-center gap-2 w-full sm:w-auto bg-gradient-to-r from-orange-600 to-red-500 hover:from-orange-700 hover:to-red-600 text-white px-5 py-2.5 rounded-xl font-medium cursor-pointer transition-all shadow-md">
        <Upload className="w-5 h-5" />
        Import Excel
        <input
          type="file"
          accept=".xlsx, .xls"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>

      <button
        onClick={handleExportClick}
        className="flex items-center gap-2 w-full sm:w-auto bg-gradient-to-r from-yellow-600 to-orange-500 hover:from-yellow-700 hover:to-orange-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md"
      >
        <FileDown className="w-5 h-5" />
        Export to Excel
      </button>
    </div>
  );
};

export default Excel;
