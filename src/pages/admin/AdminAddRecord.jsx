import React, { useContext } from "react";
import AddRecordForm from "../../components/shared/AddRecordForm";
import { AdminContext } from "../../context/AdminContext";
import { PlusCircle, UserPlus2, ClipboardEdit } from "lucide-react";

const AdminAddRecord = () => {
  const { addRecord } = useContext(AdminContext);

  const handleAddRecord = (newRecord) => {
    addRecord(newRecord);
  };

  return (
    <div className="p-6 md:p-10 bg-white shadow-lg rounded-3xl max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6 text-orange-800">
        <PlusCircle className="w-7 h-7" />
        <h2 className="text-2xl font-extrabold tracking-tight leading-tight">
          Add New Record
        </h2>
      </div>

      <div className="flex flex-col md:flex-row md:justify-start md:gap-10 gap-4 mb-8 text-sm text-orange-700">
        <div className="flex items-center gap-2">
          <UserPlus2 className="w-5 h-5" aria-hidden="true" />
          <span>Fill in customer details accurately.</span>
        </div>
        <div className="flex items-center gap-2">
          <ClipboardEdit className="w-5 h-5" aria-hidden="true" />
          <span>Ensure all required fields are completed.</span>
        </div>
      </div>

      <div className="border-t border-orange-200 pt-6">
        <AddRecordForm onAdd={handleAddRecord} />
      </div>
    </div>
  );
};

export default AdminAddRecord;
