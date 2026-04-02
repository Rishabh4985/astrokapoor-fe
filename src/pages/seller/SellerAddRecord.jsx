import React, { useContext } from "react";
import AddRecordForm from "../../components/shared/AddRecordForm";
import { SellerContext } from "../../context/SellerContext";
import {
  PlusCircle,
  UserPlus2,
  ClipboardEdit,
} from "lucide-react";

const SellerAddRecord = () => {
  const { addSellerRecord } = useContext(SellerContext);

  if (typeof addSellerRecord !== "function") {
    console.error("❌ addSellerRecord is not ready yet.");
    return (
      <div className="p-10 text-center text-red-500">
        Seller context not ready. Please refresh or log in again.
      </div>
    );
  }

  const handleAddRecord = async (newRecord) => {
    try {
      await addSellerRecord(newRecord);
    } catch (err) {
      console.error("❌ Failed to add seller record:", err);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex items-center gap-3 text-slate-900">
        <PlusCircle className="h-7 w-7 text-orange-600" />
        <h2 className="text-2xl font-extrabold tracking-tight">Add New Record</h2>
      </div>

      <div className="mb-6 flex flex-col gap-4 text-sm text-slate-600 md:flex-row">
        <div className="flex items-center gap-2">
          <UserPlus2 className="h-4 w-4 text-orange-500" />
          <span>Fill in customer details accurately.</span>
        </div>
        <div className="flex items-center gap-2">
          <ClipboardEdit className="h-4 w-4 text-orange-500" />
          <span>Ensure all required fields are completed.</span>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <AddRecordForm onAdd={handleAddRecord} />
      </div>
    </div>
  );
};

export default SellerAddRecord;
