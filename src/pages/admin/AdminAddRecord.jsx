import React, { useContext } from "react";
import AddRecordForm from "../../components/shared/AddRecordForm";
import { AdminContext } from "../../context/AdminContext";
import { PlusCircle, UserPlus2, ClipboardEdit } from "lucide-react";

const AdminAddRecord = () => {
  const { addRecord } = useContext(AdminContext);

  const handleAddRecord = async (newRecord) => {
    return addRecord(newRecord);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex items-center gap-3 text-slate-900">
        <PlusCircle className="h-7 w-7 text-orange-600" />
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
          Add New Record
        </h2>
      </div>

      <div className="mb-8 flex flex-col gap-4 text-sm text-slate-600 md:flex-row md:justify-start md:gap-10">
        <div className="flex items-center gap-2">
          <UserPlus2 className="h-5 w-5 text-orange-500" aria-hidden="true" />
          <span>Fill in customer details accurately.</span>
        </div>
        <div className="flex items-center gap-2">
          <ClipboardEdit className="h-5 w-5 text-orange-500" aria-hidden="true" />
          <span>Ensure all required fields are completed.</span>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <AddRecordForm onAdd={handleAddRecord} />
      </div>
    </div>
  );
};

export default AdminAddRecord;
