import React from "react";

const ExistingUserSearch = ({
  searchEmail,
  setSearchEmail,
  handleUserSearch,
  existingRecords,
  selectedRecord,
  setSelectedRecord,
  handleEditExistingUser,
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow max-w-4xl mx-auto">
      <h3 className="text-xl font-bold mb-4 text-orange-800">
        Search Existing User
      </h3>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by Email or Mobile"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          className="flex-1 border border-gray-300 px-4 py-2 rounded-lg"
        />
        <button
          type="button"
          onClick={handleUserSearch}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
        >
          Search
        </button>
      </div>

      {existingRecords.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-orange-700">
            Matching Records
          </h4>

          {existingRecords.map((record) => (
            <div
              key={record._id}
              onClick={() => setSelectedRecord(record)}
              className={`p-4 border rounded cursor-pointer ${
                selectedRecord?._id === record._id
                  ? "border-orange-500 bg-orange-50"
                  : "bg-gray-50"
              }`}
            >
              <p>
                <strong>Customer Name:</strong> {record.customerName}
              </p>
              <p>
                <strong>E-mail:</strong> {record.email1 || "N/A"}
              </p>
              <p>
                <strong>Mobile-1:</strong> {record.mobile1 || "N/A"}
              </p>
              <p>
                <strong>Transaction ID:</strong> {record.transactionId || "N/A"}
              </p>
            </div>
          ))}

          {selectedRecord && (
            <button
              onClick={handleEditExistingUser}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
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
