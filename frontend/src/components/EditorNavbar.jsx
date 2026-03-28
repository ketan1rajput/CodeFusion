import logo from "../images/logo.png";
import { Link } from "react-router-dom";

const EditorNavbar = ({ title = "Untitled Project" }) => {
  return (
    <header className="border-b border-white/10 bg-[#141414] px-6 lg:px-24">
      <div className="flex h-[80px] items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link to="/home">
            <img className="w-[150px] cursor-pointer" src={logo} alt="CodeFusion" />
          </Link>
          <div className="hidden md:block">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
              Editor Workspace
            </p>
            <h1 className="mt-1 text-lg font-semibold text-white">{title}</h1>
          </div>
        </div>

        <Link
          to="/home"
          className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
        >
          Back to Projects
        </Link>
      </div>
    </header>
  );
};

export default EditorNavbar;
