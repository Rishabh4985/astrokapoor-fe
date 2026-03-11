import React from "react";

const AdminPagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPrev,
  onNext,
}) => {
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="sticky bottom-0 bg-white flex justify-center items-center gap-4 py-2 border-t border-orange-300 z-10">
      <button
        onClick={onPrev}
        disabled={currentPage <= 1}
        className="px-4 py-2 rounded bg-orange-300 text-white font-semibold disabled:opacity-50 hover:bg-orange-400 transition"
      >
        Previous
      </button>

      <span className="flex items-center px-2 font-semibold text-orange-700">
        Page {currentPage} of {totalPages}
        <span className="text-sm ml-2 text-orange-600">
          (showing {startIndex} to {endIndex} of {totalItems})
        </span>
      </span>

      <button
        onClick={onNext}
        disabled={currentPage >= totalPages}
        className="px-4 py-2 rounded bg-orange-500 text-white font-semibold disabled:opacity-50 hover:bg-orange-600 transition"
      >
        Next
      </button>
    </div>
  );
};

export default React.memo(AdminPagination);
