import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import Layout from "./components/Layout";
import Home from "./pages/Home";
import NoPage from "./pages/NoPage";
import PracticeList from "./pages/PracticeList";
import SignUp from "./pages/SignUp";
import Editor from "./pages/Editor";
import FrontendPracticeWorkspace from "./pages/FrontendPracticeWorkspace";
import About from "./components/About";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Routes with Navbar */}
        <Route path="/" element={<Layout />}>
          <Route path="home" element={<Home />} />
        <Route path="practice" element={<PracticeList />} />
        <Route path="practice/:id" element={<FrontendPracticeWorkspace />} />
        <Route path="about" element={<About />} />
      </Route>

      {/* Route without Navbar */}
      <Route index element={<SignUp />} />
      <Route path="editor/:codeId" element={<Editor />} />

      <Route path="*" element={<NoPage />} />
    </Routes>
    </BrowserRouter>
  );
};

export default App;
