import React, { useState, useRef, useEffect } from 'react';

const MultiSelectDropdown = ({ options, value = [], onChange, placeholder = 'Select services' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(value);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSelected(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    if (!selected.includes(option)) {
      const newSelected = [...selected, option];
      setSelected(newSelected);
      onChange(newSelected);
    }
    // setIsOpen(false);
  };

  const handleRemove = (option) => {
    const newSelected = selected.filter(s => s !== option);
    setSelected(newSelected);
    onChange(newSelected);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
       className="border border-gray-300 rounded px-3 py-2 cursor-pointer bg-white h-[40px] flex items-center overflow-hidden min-w-0"
        onClick={() => setIsOpen(!isOpen)}
      >
<div className="flex items-center w-full min-w-0">
  <span
    className="truncate"
    title={selected.join(", ")}
  >
    {selected.length > 0
      ? selected.slice(0, 1).join(", ")
      : placeholder}
  </span>

  {selected.length > 1 && (
  <span className="ml-1 shrink-0 text-xs bg-orange-100 text-orange-900 px-2 py-0.5 rounded-full font-medium">
  +{selected.length - 2}
</span>
  )}
</div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
          {options.map(option => (
            <div
              key={option}
              className={`px-3 py-2 cursor-pointer ${
  selected.includes(option)
    ? "bg-blue-100 font-semibold"
    : "hover:bg-gray-100"
}`}
              onClick={() => handleSelect(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap mt-2 gap-1 max-h-24 overflow-y-auto">
        {selected.map(service => (
          <span key={service} className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center text-sm max-w-[200px]">
            <span className="truncate">{service}</span>
            <button
              className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
              onClick={() => handleRemove(service)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default MultiSelectDropdown;