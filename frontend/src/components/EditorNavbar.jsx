import logo from "../images/logo.png";
import { FiDownload } from "react-icons/fi";


const EditorNavbar = () => {
  return (
    <>
      <div className="EditorNavbar navbar flex items-center justify-between px-[100px] h-[80px] bg-[#141414]">
        <div className="logo">
          <img className="w-[150px] cursor-pointer" src={logo} alt="" />
        </div>
        {/* <p>
          File <span className="text-[gray]">My First Project</span>
          <i className="p-[8px] btn bg-black rounded-[5px] cursor-pointer text-[20px]">
            <FiDownload />
          </i>
        </p> */}
      </div>
    </>
  );
};

export default EditorNavbar;
