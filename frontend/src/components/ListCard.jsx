import React, { useState } from "react";
import img from "../images/code.png";
import deleteImg from "../images/delete.png";

const ListCard = () => {
  const [isDeleteModelShow, setIsDeleteModelShow] = useState(false);

  return (
    <div className="listCard mb-2 w-full flex items-center justify-between p-[10px] bg-[#141414] cursor-pointer rounded-lg hover:bg-[#202020]">
      <div className="flex items-center gap-2">
        <img className="w-[80px]" src={img} alt="Project Thumbnail" />
        <div>
          <h3 className="text-[20px] text-white">My First Project</h3>
          <p className="text-[gray] text-[14px]">This is my first project</p>
        </div>
      </div>
      <div>
        <img
          onClick={() => setIsDeleteModelShow(true)}
          className="w-[30px] cursor-pointer m-4"
          src={deleteImg}
          alt="Delete Icon"
        />
      </div>

      {isDeleteModelShow && (
        <div className="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-40 z-50 flex justify-center items-center">
          <div className="w-[25vw] h-[25vh] bg-[#141414] rounded-lg p-[20px]">
            <h3 className="text-white">
              Do you want to delete <br />
              this project?
            </h3>
            <div className="flex w-full mt-3 items-center gap-[10px]">
              <button
                className="p-[10px] rounded-lg bg-[#FF4343] text-white cursor-pointer min-w-[49%]"
                onClick={() => {
                  console.log("Project Deleted");
                  setIsDeleteModelShow(false);
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setIsDeleteModelShow(false)}
                className="p-[10px] rounded-lg bg-[#1A1919] text-white cursor-pointer min-w-[49%]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListCard;
