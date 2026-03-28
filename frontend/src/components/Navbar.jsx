import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Avatar from "react-avatar";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../images/logo.png";
import { persistor } from "../utils/appStore";
import { useDispatch, useSelector } from "react-redux";
import { setUserId, setUsername } from "../utils/UserSlice";

const navLinkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm transition ${
    isActive
      ? "bg-cyan-400 text-slate-950"
      : "text-slate-300 hover:bg-white/5 hover:text-white"
  }`;

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userName = useSelector((state) => state.user.username) || "User";

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  async function handleLogout() {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/logout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Logout Failed", error);
    } finally {
      await persistor.purge();
      await persistor.flush();
      dispatch(setUserId(null));
      dispatch(setUsername(""));
      navigate("/");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#141414]/95 px-6 backdrop-blur lg:px-24">
      <div className="flex h-[80px] items-center justify-between gap-6">
        <Link to="/home" className="shrink-0">
          <img className="w-[150px] cursor-pointer" src={logo} alt="CodeFusion" />
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <NavLink to="/home" className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/practice" className={navLinkClass}>
            Practice
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
        </nav>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((currentState) => !currentState)}
            className="rounded-full"
            aria-label="Open profile menu"
          >
            <Avatar
              name={userName}
              size="40"
              round="50%"
              className="cursor-pointer"
            />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-[56px] w-[220px] rounded-2xl border border-white/10 bg-[#050505] p-4 shadow-lg shadow-black/50">
              <div className="border-b border-white/10 pb-3">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                  Signed In As
                </p>
                <h3 className="mt-2 text-base font-semibold text-white">
                  {userName}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 w-full rounded-xl border border-white/10 px-4 py-2 text-left text-sm text-slate-200 transition hover:border-cyan-300/30 hover:text-white"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
