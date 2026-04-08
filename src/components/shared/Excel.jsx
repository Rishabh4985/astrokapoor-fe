import React from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { Upload, FileDown } from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

const Excel = ({ onImport, onExport }) => {
  const { isAdmin, authToken } = useAuth();
  const showImport = isAdmin;

  const headerMap = {
    "Date of Payment": "dateOfPayment",
    "Customer Name": "customerName",
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

  const normalizeHeaderKey = (value) =>
    (value ?? "")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const buildImportHeaderMap = () => {
    const map = {};
    const aliasEntries = [
      ...Object.entries(headerMap),
      ["Mobile-1", "mobile1"],
      ["Mobile-2", "mobile2"],
      ["Email-1", "email1"],
      ["Email-2", "email2"],
      ["Handled By", "handleBy"],
      ["Handler By", "handleBy"],
      ["Transaction Id", "transactionId"],
      ["Air Bill No", "airBillNo"],
      ["Airbill No", "airBillNo"],
      ["SKU No", "skuNo"],
      ["Gem", "gems"],
      ["Gemstone", "gems"],
      ["Gem 1", "gems1"],
      ["Gems-1", "gems1"],
      ["Gem-1", "gems1"],
      ["Gem 2", "gems2"],
      ["Gems-2", "gems2"],
      ["Gem-2", "gems2"],
      ["Gem 3", "gems3"],
      ["Gems-3", "gems3"],
      ["Gem-3", "gems3"],
      ["Gem 4", "gems4"],
      ["Gems-4", "gems4"],
      ["Gem-4", "gems4"],
    ];

    aliasEntries.forEach(([label, field]) => {
      const normalizedLabel = normalizeHeaderKey(label);
      if (normalizedLabel) {
        map[normalizedLabel] = field;
      }
    });

    Object.values(headerMap).forEach((field) => {
      const normalizedField = normalizeHeaderKey(field);
      if (normalizedField) {
        map[normalizedField] = field;
      }
    });

    return map;
  };

  const importHeaderMap = buildImportHeaderMap();
  const resolveImportField = (rawHeader) =>
    importHeaderMap[normalizeHeaderKey(rawHeader)] || "";

  const allowedFields = Object.values(headerMap);

  const normalizeService = (value) => {
    const raw = (value || "").toString().trim();
    const val = raw.toLowerCase();

    if (["consultation", "consultations"].includes(val)) return "Consultation";
    if (["product", "products"].includes(val)) return "Products";
    if (["gemstone", "gemstones"].includes(val)) return "Gemstones";

    return raw;
  };

  const toValidDate = (year, month, day) => {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);

    if (
      !Number.isInteger(y) ||
      !Number.isInteger(m) ||
      !Number.isInteger(d) ||
      m < 1 ||
      m > 12 ||
      d < 1 ||
      d > 31
    ) {
      return null;
    }

    const dt = new Date(Date.UTC(y, m - 1, d));
    if (Number.isNaN(dt.getTime())) return null;
    if (
      dt.getUTCFullYear() !== y ||
      dt.getUTCMonth() !== m - 1 ||
      dt.getUTCDate() !== d
    ) {
      return null;
    }

    return dt;
  };

  const toYmd = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseSlashDate = (first, second, year, preferDayFirst = true) => {
    const firstNum = Number(first);
    const secondNum = Number(second);

    if (!Number.isInteger(firstNum) || !Number.isInteger(secondNum)) {
      return null;
    }

    // Unambiguous DD/MM/YYYY
    if (firstNum > 12 && secondNum <= 12) {
      return toValidDate(year, secondNum, firstNum);
    }

    // Unambiguous MM/DD/YYYY
    if (secondNum > 12 && firstNum <= 12) {
      return toValidDate(year, firstNum, secondNum);
    }

    if (preferDayFirst) {
      return (
        toValidDate(year, secondNum, firstNum) ||
        toValidDate(year, firstNum, secondNum)
      );
    }

    return (
      toValidDate(year, firstNum, secondNum) ||
      toValidDate(year, secondNum, firstNum)
    );
  };

  const parseDateOfPayment = (value) => {
    if (value === null || value === undefined || value === "") return "";

    if (value instanceof Date) {
      if (Number.isNaN(value.getTime())) return "";
      // Spreadsheet Date objects are often local-midnight based.
      const localDate = new Date(
        Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()),
      );
      return toYmd(localDate);
    }

    if (typeof value === "number") {
      const parsed = XLSX.SSF.parse_date_code(value);
      return parsed
        ? `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`
        : "";
    }

    const raw = value.toString().trim();
    if (!raw) return "";

    if (/^\d+(\.\d+)?$/.test(raw)) {
      const parsed = XLSX.SSF.parse_date_code(Number(raw));
      if (parsed) {
        return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
      }
    }

    const datePart = raw
      .split(/[ T]/)[0]
      .replace(/\./g, "/")
      .replace(/-/g, "/");

    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(datePart)) {
      const [first, second, third] = datePart.split("/");
      const year =
        third.length === 2
          ? Number(third) >= 70
            ? `19${third}`
            : `20${third}`
          : third;

      // Prefer DD/MM/YYYY for ambiguous values.
      const parsed = parseSlashDate(first, second, year, true);
      if (parsed) return toYmd(parsed);
    }

    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(datePart)) {
      const [year, month, day] = datePart.split("/");
      const ymd = toValidDate(year, month, day);
      if (ymd) return toYmd(ymd);
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return "";

    // Use local date parts for free-form date/time strings entered by users.
    const localDate = new Date(
      Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()),
    );
    return toYmd(localDate);
  };

  const buildUploadErrorMessage = (err) => {
    const serverData = err?.response?.data;
    const serverMessage = serverData?.message;
    const errorEntries = Array.isArray(serverData?.errors) ? serverData.errors : [];

    if (errorEntries.length > 0) {
      const formatEntry = (entry) => {
        const rowFromIndex =
          Number.isInteger(entry?.index) && entry.index >= 0
            ? entry.index + 1
            : null;
        const rowNumber =
          rowFromIndex ||
          (Number.isInteger(entry?.row) && entry.row > 0 ? entry.row : null);
        const rowText = rowNumber !== null ? `row ${rowNumber}` : "a row";

        const fieldText = entry?.field ? ` [${entry.field}]` : "";
        const valueText =
          entry?.value !== undefined && entry?.value !== null && entry?.value !== ""
            ? ` (value: ${entry.value})`
            : "";
        const detail = entry?.error || entry?.message || "Validation failed";

        return `${rowText}${fieldText}: ${detail}${valueText}`;
      };

      const sample = errorEntries.slice(0, 10).map(formatEntry).join("; ");
      const moreCount = errorEntries.length - 10;
      const moreText = moreCount > 0 ? `; +${moreCount} more errors` : "";
      const prefix = serverMessage ? `${serverMessage}. ` : "";

      return `${prefix}${sample}${moreText}`;
    }

    return serverData?.error || serverMessage || err?.message || "Unknown upload error";
  };

  const uploadRecordsToBackend = async (records) => {
    if (!isAdmin) {
      toast.error("Only admin users can import records.");
      return { inserted: 0, attempted: 0 };
    }

    if (!authToken) {
      toast.error("Session expired. Please log in again.");
      return { inserted: 0, attempted: 0 };
    }

    try {
      const response = await axios.post(
        `${API_BASE}/admin/import-records`,
        { records },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        },
      );

      const attempted =
        typeof response?.data?.attempted === "number"
          ? response.data.attempted
          : records.length;
      const inserted =
        typeof response?.data?.inserted === "number"
          ? response.data.inserted
          : attempted;

      return { inserted, attempted };
    } catch (err) {
      const details = buildUploadErrorMessage(err);
      console.error(`Import upload failed: ${details}`);
      if (err?.response?.data) {
        console.error("Import API response:", err.response.data);
      }
      const errorEntries = Array.isArray(err?.response?.data?.errors)
        ? err.response.data.errors
        : [];
      if (errorEntries.length > 0) {
        console.error("Import validation errors (row-wise):");
        errorEntries.forEach((entry) => {
          const rowNumber = Number.isInteger(entry?.row)
            ? entry.row
            : Number.isInteger(entry?.index)
              ? entry.index + 1
              : null;
          const fieldText = entry?.field ? ` [${entry.field}]` : "";
          const detail = entry?.error || entry?.message || "Validation failed";
          const valueText =
            entry?.value !== undefined && entry?.value !== null && entry?.value !== ""
              ? ` (value: ${entry.value})`
              : "";
          console.error(
            `${rowNumber !== null ? `row ${rowNumber}` : "row ?"}${fieldText}: ${detail}${valueText}`,
          );
        });
      }
      toast.error(`Import rejected (${details})`);
      throw err;
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    e.target.value = "";

    const allRecords = [];
    let filesProcessed = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (evt) => {
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

            const headerIndexMap = new Map();
            rawHeaders.forEach((headerValue, index) => {
              const fieldKey = resolveImportField(headerValue);
              if (!fieldKey) return;

              const existingIndexes = headerIndexMap.get(fieldKey) || [];
              existingIndexes.push(index);
              headerIndexMap.set(fieldKey, existingIndexes);
            });

            if (headerIndexMap.size === 0) return;

            const pickCellValueFromIndexes = (row, indexes = []) => {
              if (!Array.isArray(indexes) || indexes.length === 0) return "";

              const isPresent = (cell) => {
                if (cell === null || cell === undefined) return false;
                if (typeof cell === "string") return cell.trim() !== "";
                return true;
              };

              for (const idx of indexes) {
                const candidate = row[idx];
                if (isPresent(candidate)) return candidate;
              }

              const fallback = row[indexes[0]];
              return fallback ?? "";
            };

            const records = sheet
              .slice(1)
              .map((row) => {
                const rowHasAnyData = Array.from(headerIndexMap.values()).some(
                  (indexes) => {
                    const cell = pickCellValueFromIndexes(row, indexes);
                    if (cell === null || cell === undefined) return false;
                    if (typeof cell === "string") return cell.trim() !== "";
                    return true;
                  },
                );

                if (!rowHasAnyData) return null;

                const obj = {};
                headerIndexMap.forEach((indexes, key) => {
                  let value = pickCellValueFromIndexes(row, indexes);

                  if (key === "dateOfPayment") {
                    value = parseDateOfPayment(value);
                  }

                  if (["amount", "pendingAmount", "refund"].includes(key)) {
                    const parsed = parseFloat(value);
                    value = isNaN(parsed) ? 0 : parsed;
                  }

                  if (key === "country") {
                    value = value.toString().trim().toLowerCase();
                  }

                  if (key === "service") {
                    value = normalizeService(value);
                  }
                  obj[key] = value;
                });
                obj.category =
                  sheetName.charAt(0).toUpperCase() +
                  sheetName.slice(1).toLowerCase();

                return obj;
              })
              .filter(Boolean);

            allRecords.push(...records);
          });

          filesProcessed++;

          if (filesProcessed === files.length) {
            const sortedRecords = [...allRecords].sort((a, b) => {
              const dateA = new Date(a.dateOfPayment || 0);
              const dateB = new Date(b.dateOfPayment || 0);
              return dateB - dateA;
            });

            if (!sortedRecords.length) {
              toast.warn("No valid records found in the selected file.");
              return;
            }

            const importSummary = await uploadRecordsToBackend(sortedRecords);

            if (onImport) {
              await onImport(sortedRecords);
            }

            if (importSummary.inserted === importSummary.attempted) {
              toast.success(`Imported ${importSummary.inserted} records successfully.`);
            } else {
              toast.warn(
                `Imported ${importSummary.inserted} of ${importSummary.attempted} records.`,
              );
            }
          }
        } catch (err) {
          if (!err?.isAxiosError) {
            toast.error("Error reading Excel file.");
          }
          console.error(err);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  const handleExportClick = async () => {
    try {
      if (!onExport) {
        toast.warning("No records available to export");
        return;
      }

      const records = await onExport();
      if (!Array.isArray(records) || records.length === 0) {
        toast.warning("No records available to export");
        return;
      }

      const categories = ["consultation", "products", "gemstones"];
      const sheetNameMap = {
        consultation: "Consultation",
        products: "Products",
        gemstones: "Gemstones",
      };

      const reverseHeaderMap = Object.entries(headerMap).reduce(
        (acc, [excelHeader, fieldName]) => {
          acc[fieldName] = excelHeader;
          return acc;
        },
        {},
      );

      const normalizeCategory = (value) =>
        value?.toString().trim().toLowerCase() || "";

      const toCellValue = (value) => {
        if (Array.isArray(value)) {
          return value
            .map((item) => toCellValue(item))
            .filter(Boolean)
            .join(", ");
        }

        if (value && typeof value === "object") {
          return value.name || value.label || value.value || "";
        }

        return value ?? "";
      };

      const getRecordCategories = (record) => {
        const raw = record?.category;

        if (Array.isArray(raw)) {
          return raw
            .flatMap((item) => toCellValue(item).toString().split(","))
            .map(normalizeCategory)
            .filter(Boolean);
        }

        return toCellValue(raw)
          .toString()
          .split(",")
          .map(normalizeCategory)
          .filter(Boolean);
      };

      const filterAndMapRecords = (category) => {
        return records
          .filter((record) => getRecordCategories(record).includes(category))

          .map((record) => {
            const mapped = {};

            allowedFields.forEach((field) => {
              if (record[field] !== undefined) {
                const excelKey = reverseHeaderMap[field];
                mapped[excelKey] = toCellValue(record[field]);
              }
            });
            return mapped;
          });
      };

      const workbook = XLSX.utils.book_new();

      categories.forEach((category) => {
        const data = filterAndMapRecords(category);
        if (data.length > 0) {
          const worksheet = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            sheetNameMap[category],
          );
        }
      });

      if (workbook.SheetNames.length === 0) {
        const fallbackData = records.map((record) => {
          const mapped = {};
          allowedFields.forEach((field) => {
            if (record[field] !== undefined) {
              const excelKey = reverseHeaderMap[field];
              mapped[excelKey] = toCellValue(record[field]);
            }
          });
          return mapped;
        });

        if (fallbackData.length > 0) {
          const worksheet = XLSX.utils.json_to_sheet(fallbackData);
          XLSX.utils.book_append_sheet(workbook, worksheet, "Records");
        }
      }

      XLSX.writeFile(workbook, "sales_data.xlsx");
      toast.success("Excel exported successfully!");
    } catch (err) {
      toast.error("Failed to export Excel.");
      console.error(err);
    }
  };

  return (
    <div className="flex flex-wrap gap-4 mt-4">
      {showImport && (
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
      )}
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
