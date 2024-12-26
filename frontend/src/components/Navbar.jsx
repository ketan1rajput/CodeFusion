import React from "react";
import logo from "../images/logo.png";
import { Link } from "react-router-dom";
import Avatar from 'react-avatar';
import { removeClass, toggleClass } from "../helper";
import { MdLightMode } from "react-icons/md";
import { BsGridFill } from "react-icons/bs";

const Navbar = () => {
  return (
    <>
      <div className="navbar flex items-center justify-between px-[100px] h-[80px] bg-[#141414]">
        <div className="logo">
          <img className="w-[150px] cursor-pointer" src={logo} alt="" />
        </div>
        <div className="links flex items-center gap-2">
          <Link>Home</Link>
          <Link>About</Link>
          <Link>Contact</Link>
          <Link>Services</Link>
          <Avatar
            onClick={() => {
              toggleClass(".dropDownNavbar", "hidden");
            }}
            name="Wim Mostmans"
            size="40"
            round="50%"
            className="cursor-pointer ml-2"
          />
        </div>
        <div className="dropDownNavbar hidden absolute right-[60px] p-[10px] rounded-lg shadow-lg shadow-black/50 bg-[#050505] top-[80px] w-[150px] h-[160px]">
          <div className="py-[10px] border-b-[1px] border-[#fff]">
            <h3 className="text-[17px]">Ketan Singh</h3>
            <i
              className="flex items-center gap-2 mb-2 mt-3 "
              style={{ fontSize: "normal" }}
            >
              <MdLightMode className="text-[20px]" />
              Light mode
            </i>
            <i
              className="flex items-center gap-2 mb-2 mt-3 "
              style={{ fontSize: "normal" }}
            >
              <BsGridFill className="text-[20px]" />
              Grid Layout
            </i>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
