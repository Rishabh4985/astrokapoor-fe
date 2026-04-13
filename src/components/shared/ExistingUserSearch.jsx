import React, { useEffect, useRef, useState } from "react";
import { debounce } from "../../utils/debounce";

const ExistingUserSearch = ({
  searchEmail,
  setSearchEmail,
  handleUserSearch,
  isSearching = false,
  existingRecords,
  selectedRecord,
  setSelectedRecord,
  handleEditExistingUser,
}) => {
  const [localSearchValue, setLocalSearchValue] = useState(searchEmail || "");

  const debouncedSearchRef = useRef(
    debounce((value) => {
      setSearchEmail(value);
    }, 500),
  );

  useEffect(() => {
    setLocalSearchValue(searchEmail || "");
  }, [searchEmail]);

  useEffect(() => {
    const debouncedSearch = debouncedSearchRef.current;
    return () => {
      debouncedSearch.cancel?.();
    };
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchValue(value);
    debouncedSearchRef.current(value);
  };

  const handleSearchClick = () => {
    debouncedSearchRef.current.cancel?.();
    setSearchEmail(localSearchValue);
    handleUserSearch(localSearchValue);
  };

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="mb-1 text-xl font-bold text-slate-900">
        Search Existing User
      </h3>
      <p className="mb-4 text-sm text-slate-500">
        Search using email or mobile, then continue with a fresh transaction.
      </p>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search by Email or Mobile"
          value={localSearchValue}
          onChange={handleSearchChange}
          disabled={isSearching}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearchClick();
            }
          }}
          className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
        <button
          type="button"
          onClick={handleSearchClick}
          disabled={isSearching}
          className="h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-amber-600"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </div>

      {existingRecords.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-slate-800">
            Matching Records
          </h4>

          {existingRecords.map((record) => (
            <div
              key={record._id}
              onClick={() => setSelectedRecord(record)}
              className={`cursor-pointer rounded-xl border p-4 transition ${
                selectedRecord?._id === record._id
                  ? "border-orange-300 bg-orange-50 shadow-sm"
                  : "border-slate-200 bg-slate-50 hover:bg-slate-100"
              }`}
            >
              <p className="text-sm text-slate-700">
                <strong>Customer Name:</strong> {record.customerName}
              </p>
              <p className="text-sm text-slate-700">
                <strong>E-mail:</strong> {record.email1 || "N/A"}
              </p>
              <p className="text-sm text-slate-700">
                <strong>Mobile-1:</strong> {record.mobile1 || "N/A"}
              </p>
              <p className="text-sm text-slate-700">
                <strong>Transaction ID:</strong> {record.transactionId || "N/A"}
              </p>
            </div>
          ))}

          {selectedRecord && (
            <button
              onClick={handleEditExistingUser}
              className="mt-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-amber-600"
            >
              Add New Record for Selected User
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ExistingUserSearch;
