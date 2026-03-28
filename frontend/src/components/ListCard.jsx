import { useState } from "react";
import img from "../images/code.png";
import deleteImg from "../images/delete.png";
import { useNavigate } from "react-router-dom";

const ListCard = ({ codeDetails, handleDelete }) => {
  const [isDeleteModelShow, setIsDeleteModelShow] = useState(false);
  const navigate = useNavigate();

  const updatedAtDate = new Date(codeDetails.updatedAt).toLocaleDateString(
    "en-GB"
  );
  const updatedAtTime = new Date(codeDetails.updatedAt).toLocaleTimeString(
    "en-GB"
  );

  return (
    <div
      className="listCard mb-2 flex w-full cursor-pointer items-center justify-between rounded-lg bg-[#141414] p-[10px] hover:bg-[#202020]"
      onClick={() => navigate(`/editor/${codeDetails.code_id}`)}
    >
      <div className="flex items-center gap-2">
        <img className="w-[80px]" src={img} alt="Project thumbnail" />
        <div>
          <h3 className="text-[20px] text-white">{codeDetails.code_title}</h3>
          <p className="text-[14px] text-[gray]">
            Last updated on {updatedAtDate} at {updatedAtTime}
          </p>
        </div>
      </div>
      <div>
        <img
          onClick={(event) => {
            event.stopPropagation();
            setIsDeleteModelShow(true);
          }}
          className="w-[30px] cursor-pointer m-4"
          src={deleteImg}
          alt="Delete project"
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
                  handleDelete(codeDetails.code_id);
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
