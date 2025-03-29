import React, { useEffect, useState } from "react";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { MdOutlineCancel } from "react-icons/md";

const PopupModal = ({ message, type, isOpen, onClose }) => {
  const [uniqueKey, setUniqueKey] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setUniqueKey((prevKey) => prevKey + 1); // Update key on open
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  const Icon = type === "success" ? IoCheckmarkCircleOutline : MdOutlineCancel;

  return (
    <div
      key={uniqueKey}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
    >
      <div className={`p-6 rounded-2xl shadow-lg ${bgColor} text-white w-96`}>
        <div className="flex items-center gap-4">
          <Icon className="text-4xl" />
          <div>
            <h2 className="text-lg font-semibold">
              {type === "success" ? "Success" : "Error"}
            </h2>
            <p>{message}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-white text-black py-2 rounded-lg hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PopupModal;
