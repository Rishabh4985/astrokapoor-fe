import React from "react";

const SellerPagination = ({
  currentPage,
  totalPages,
  startRecord,
  endRecord,
  filteredRecordsLength,
  goToPage,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="sticky bottom-0 z-10 mt-3 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:flex-row">
      <div className="text-xs font-medium text-orange-700 sm:text-sm">
        Showing <span className="font-semibold text-orange-800">{startRecord}</span>{" "}
        to <span className="font-semibold text-orange-800">{endRecord}</span> of{" "}
        <span className="font-semibold text-orange-800">{filteredRecordsLength}</span>{" "}
        records
      </div>

      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-45"
      >
        Previous
      </button>

      <span className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-orange-600 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-45"
      >
        Next
      </button>
    </div>
  );
};

export default SellerPagination;
