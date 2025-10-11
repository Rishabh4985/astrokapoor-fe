import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Pencil, Save } from "lucide-react";

const SellerProfile = () => {
  const { currentSeller, setCurrentSeller } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    dob: "",
  });

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (currentSeller) {
      setFormData((prev) => ({
        ...prev,
        email: currentSeller.email || "",
        dob: currentSeller.dob || "",
      }));
    }
  }, [currentSeller]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePic" && files.length) {
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profilePic: fileReader.result,
        }));
      };
      fileReader.readAsDataURL(files[0]);
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = () => {
    const updatedProfile = {
      ...currentSeller,
      dob: formData.dob,
    };

    localStorage.setItem("currentSeller", JSON.stringify(updatedProfile));
    setCurrentSeller(updatedProfile);

    const allSalespersons =
      JSON.parse(localStorage.getItem("salespersons")) || [];

    const updatedSalespersons = allSalespersons.map((sp) =>
      sp.email === updatedProfile.email ? updatedProfile : sp
    );

    localStorage.setItem("salespersons", JSON.stringify(updatedSalespersons));

    setEditMode(false);
  };
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-orange-700 border-b pb-2">
        Seller Profile
      </h2>

      <form className="space-y-5">
        <div>
          <label className="block font-medium text-orange-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            readOnly
            className="w-full px-4 py-2 rounded border bg-gray-100 text-gray-600 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block font-medium text-orange-700 mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            disabled={!editMode}
            className="w-full px-4 py-2 rounded border"
          />
        </div>

        <div className="pt-4">
          {editMode ? (
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition"
            >
              <Save size={18} />
              Save Changes
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
            >
              <Pencil size={18} />
              Edit Profile
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SellerProfile;
