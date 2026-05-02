import { useState } from "react";

const DialogBox = ({ text, initialValue = "", onClose, onConfirm }) => {
  const [title, setTitle] = useState(initialValue);
  const [error, setError] = useState("");

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setError("");
  };

  const handleConfirm = () => {
    const trimmedTitle = title.trim();

    if (trimmedTitle.length > 0) {
      onConfirm(trimmedTitle);
    } else {
      setError("Title is required.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141414] p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Do you want to save this project?
        </h3>
        <input
          type="text"
          placeholder="Enter title of project"
          className="w-full rounded-lg border border-white/10 bg-[#1A1A1A] px-4 py-3 text-white placeholder-slate-400 transition focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
          value={title}
          onChange={handleTitleChange}
        />
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            className="flex-1 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-900 transition hover:bg-cyan-300"
            onClick={handleConfirm}
          >
            {text}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogBox;
