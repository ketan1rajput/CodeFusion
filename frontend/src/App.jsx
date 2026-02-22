import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import NoPage from "./pages/NoPage";
import SignUp from "./pages/SignUp";
import Editor from "./pages/Editor";
import About from "./components/About";
import Practice from "./components/Practice";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes with Navbar */}
        <Route path="/" element={<Layout />}>
          <Route path="home" element={<Home />} />
          <Route path="practice" element={<Practice />} />
          <Route path="about" element={<About />} />
          <Route path="editor/:codeId" element={<Editor />} />
        </Route>

        {/* Route without Navbar */}
        <Route index element={<SignUp />} />

        <Route path="*" element={<NoPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;