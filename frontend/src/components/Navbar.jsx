import axios from "axios";
import logo from "../images/logo.png";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "react-avatar";
import { toggleClass } from "../helper";
import { MdLightMode } from "react-icons/md";
import { BsGridFill } from "react-icons/bs";
import { persistor } from "../utils/appStore";
import { useDispatch, useSelector } from "react-redux";
import { setUserId } from "../utils/UserSlice";
import About from "./About";

const Navbar = ({ isGridLayout, setIsGridLayout }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get the username from Redux state
  const UserName = useSelector((state) => state.user.username) || "User";

  const handleLogout = () => {
    axios
      .post(
        `${import.meta.env.VITE_BACKEND_URL}/api/logout`,
        {},
        { withCredentials: true }
      )
      .then(() => {
        persistor.purge(); // Clears persisted state in localStorage
        persistor.flush(); // Ensures pending writes are flushed
        dispatch(setUserId(null)); // Reset user state in Redux
        navigate("/"); // Redirect to signUp page
      })
      .catch((err) => console.error("Logout Failed", err));
  };

  return (
    <>
      <div className="navbar flex items-center justify-between px-[100px] h-[80px] bg-[#141414]">
        <div className="logo">
          <img className="w-[150px] cursor-pointer" src={logo} alt="logo" />
        </div>
        <div className="links flex items-center gap-2">
          <Link>Home</Link>
          <Link to="/about">About</Link>
          <Link>Contact</Link>
          <Link>Services</Link>

          {/* Display the first letter of the username */}
          <Avatar
            onClick={() => {
              toggleClass(".dropDownNavbar", "hidden");
            }}
            name={UserName} // Avatar shows initials automatically
            size="40"
            round="50%"
            className="cursor-pointer ml-2"
          />
        </div>

        <div className="dropDownNavbar hidden absolute right-[60px] p-[10px] rounded-lg shadow-lg shadow-black/50 bg-[#050505] top-[80px] w-[150px] h-[160px]">
          <div className="py-[10px] border-b-[1px] border-[#fff]">
            <h3 className="text-[17px]">{UserName}</h3>
            {/* <i
              className="flex items-center gap-2 mb-2 mt-3 "
              style={{ fontSize: "normal" }}
            >
              <MdLightMode className="text-[20px]" />
              Light mode
            </i> */}
            {/* <i
              onClick={() => setIsGridLayout((prev) => !prev)}
              className="flex items-center gap-2 mb-2 mt-3 "
              style={{ fontSize: "normal" }}
            >
              <BsGridFill className="text-[20px]" />
              Grid Layout
            </i> */}
            <div id="logout" onClick={handleLogout} className="cursor-pointer">
              {`<-`} &nbsp; Logout
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
