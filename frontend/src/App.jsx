import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Home from "./pages/Home";
import NoPage from "./pages/NoPage";
import SignUp from "./pages/SignUp";
import Editior from "./pages/Editor";
import About from "./components/About";

const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignUp />} />
          <Route path="/home" element={<Home />} />
          <Route path="*" element={<NoPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/editor/:codeId" element={<Editior />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;
