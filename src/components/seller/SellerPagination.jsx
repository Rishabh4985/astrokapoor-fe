import React from "react";

const SellerPagination = ({
  currentPage,
  totalPages,
  startRecord,
  endRecord,
  filteredRecordsLength,
  goToPage,
}) => {
  return (
    <div className="sticky bottom-0 bg-white flex justify-center items-center gap-4 py-2 border-t border-orange-300 z-10">
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-orange-300 text-white rounded disabled:opacity-50"
      >
        Previous
      </button>

      <span>
        Page {currentPage} of {totalPages}
        <span className="text-xs text-orange-700 ml-2">
          (showing {startRecord}–{endRecord} of {filteredRecordsLength})
        </span>
      </span>

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-orange-500 text-white rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

export default SellerPagination;
