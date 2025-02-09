import { useState, useEffect } from "react";
import EditorNavbar from "../components/EditorNavbar";
import Editor from "@monaco-editor/react";
import { MdLightMode } from "react-icons/md";
import { AiOutlineExpandAlt } from "react-icons/ai";
import { FaSave } from "react-icons/fa";
import axios from "axios";
import BackButton from "../components/BackButton";
import DialogBox from "../components/DialogBox";
import { useSelector } from "react-redux";

const Editior = () => {
  const [tab, setTab] = useState("html");
  const [isLightMode, setIsLightMode] = useState(true);
  const [isExpanded, setisExpanded] = useState(false);
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [jsCode, setJsCode] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const codeId = useSelector((state) => state.user.codeId);
  const savedHtmlCode = useSelector((state) => state.code.html);
  const savedCssCode = useSelector((state) => state.code.css); 
  const savedJsCode = useSelector((state) => state.code.javascript);


  const changeTheme = () => {
    document.body.classList.toggle("lightMode", isLightMode);
    setIsLightMode(!isLightMode);
  };

  useEffect(() => {
    if (savedHtmlCode || savedCssCode || savedJsCode) {
      setHtmlCode(savedHtmlCode || "");
      setCssCode(savedCssCode || "");
      setJsCode(savedJsCode || "");
    }
  }, [savedHtmlCode, savedCssCode, savedJsCode]);

  const run = (html, css, js) => {
    const iframe = document.getElementById("iframe");
    iframe.srcdoc = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>${js}<\/script>
      </body>
      </html>
    `;
  };

  // as soon as the html, css, and js codes are updated, run the code
  useEffect(() => {
    run(htmlCode, cssCode, jsCode);
  }, [htmlCode, cssCode, jsCode]);

  const handleChange = (value, type) => {
    if (type === "html") setHtmlCode(value);
    if (type === "css") setCssCode(value);
    if (type === "js") setJsCode(value);

    run(
      type === "html" ? value : htmlCode,
      type === "css" ? value : cssCode,
      type === "js" ? value : jsCode
    );
  };

  const handleDialogOpen = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleDialogConfirm = (title) => {
    // Use the title along with the code to send to the backend
    axios
      .post(`http://localhost:5000/api/save/${codeId}`, {
        title: title, // Send the title from the input field
        htmlCode: htmlCode,
        cssCode: cssCode,
        javaScriptCode: jsCode,
      })
      .then((res) => {
        if (res.data) {
          console.log(res.data.message);
        }
      })
      .catch((error) => {
        console.log(error);
      });
    setIsDialogOpen(false);
  };

  return (
    <>
      <EditorNavbar />
      <div className="flex">
        <div className={`left ${isExpanded ? "w-full" : "w-1/2"}`}>
          <div className="tabs flex items-center justify-between gap-2 w-full bg-[#1A1919] h-[50px] px-[40px]">
            <div className="tabs flex items-center gap-2">
              {["html", "css", "js"].map((item) => (
                <div
                  key={item}
                  onClick={() => setTab(item)}
                  className={`tab cursor-pointer p-[6px] bg-[#1E1E1E] px-[10px] ${
                    tab === item ? "text-blue-500" : ""
                  }`}
                >
                  {item.toUpperCase()}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <BackButton />
              <div className="cursor-pointer" onClick={handleDialogOpen}>
                <FaSave />
              </div>
              {isDialogOpen && (
                <DialogBox
                  text="save "
                  codetitle={htmlCode} // Optionally pass the title as a prop if needed
                  onClose={handleDialogClose}
                  onConfirm={handleDialogConfirm}
                />
              )}
              <i className="text-[20px] cursor-pointer" onClick={changeTheme}>
                <MdLightMode />
              </i>
              <i
                className="text-[20px] cursor-pointer"
                onClick={() => setisExpanded(!isExpanded)}
              >
                <AiOutlineExpandAlt />
              </i>
            </div>
          </div>
          {tab === "html" && (
            <Editor
              onChange={(value) => handleChange(value || "", "html")}
              height="82vh"
              theme={isLightMode ? "vs-dark" : "vs-light"}
              language="html"
              value={htmlCode}
            />
          )}
          {tab === "css" && (
            <Editor
              onChange={(value) => handleChange(value || "", "css")}
              height="82vh"
              theme={isLightMode ? "vs-dark" : "vs-light"}
              language="css"
              value={cssCode}
            />
          )}
          {tab === "js" && (
            <Editor
              onChange={(value) => handleChange(value || "", "js")}
              height="82vh"
              theme={isLightMode ? "vs-dark" : "vs-light"}
              language="javascript"
              value={jsCode}
            />
          )}
        </div>
        <iframe
          id="iframe"
          className={`min-h-[82vh] ${
            isExpanded ? "hidden" : "w-1/2"
          } bg-[#fff]`}
        ></iframe>
      </div>
    </>
  );
};

export default Editior;
