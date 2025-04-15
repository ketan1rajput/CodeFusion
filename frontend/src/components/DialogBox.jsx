import { useState } from "react";
import PopupModal from "./PopupModal";

const DialogBox = ({ text, onClose, onConfirm }) => {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleConfirm = () => {
    //pass the title value back to the parent on confirm
    if (title.length > 0) {
      onConfirm(title);
    } else {
      setError("Title is required !");
    }
  };
  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-40 z-50 flex justify-center items-center">
      <div className="w-[25vw] h-[25vh] bg-[#141414] rounded-lg p-[20px]">
        <h3 className="text-white">
          Do you want to {text}
          this project?
        </h3>
        <input
          type="text"
          placeholder="Enter title of project"
          className="bg-[#141414] p-1 m-2 rounded-lg"
          value={title}
          onChange={handleTitleChange}
        ></input>
        {error && <p className="text-red-500">{error}</p>}
        <div className="flex w-full mt-3 items-center gap-[10px]">
          <button
            className="p-[10px] rounded-lg bg-[#FF4343] text-white cursor-pointer min-w-[49%]"
            onClick={handleConfirm}
          >
            {text}
          </button>
          <button
            onClick={onClose}
            className="p-[10px] rounded-lg bg-[#1A1919] text-white cursor-pointer min-w-[49%]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogBox;
