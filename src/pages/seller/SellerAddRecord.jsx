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
    <div className="p-6 md:p-10 bg-white shadow-md rounded-2xl">
      <div className="flex items-center gap-3 mb-6 text-orange-800">
        <PlusCircle className="w-7 h-7" />
        <h2 className="text-2xl font-bold">Add New Record</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 text-sm text-orange-700">
        <div className="flex items-center gap-2">
          <UserPlus2 className="w-4 h-4" />
          <span>Fill in customer details accurately.</span>
        </div>
        <div className="flex items-center gap-2">
          <ClipboardEdit className="w-4 h-4" />
          <span>Ensure all required fields are completed.</span>
        </div>
      </div>

      <div className="border-t border-orange-200 pt-4">
        <AddRecordForm onAdd={handleAddRecord} />
      </div>
    </div>
  );
};

export default SellerAddRecord;
