import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { AiOutlineExpandAlt } from "react-icons/ai";
import { FaSave } from "react-icons/fa";
import { MdLightMode } from "react-icons/md";
import { RiFileDownloadLine } from "react-icons/ri";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import DialogBox from "../components/DialogBox";
import EditorNavbar from "../components/EditorNavbar";

function escapeClosingScriptTags(code = "") {
  return code.replace(/<\/script/gi, "<\\/script");
}

function buildPreviewDocument(html, css, js) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>${escapeClosingScriptTags(js)}</script>
      </body>
    </html>
  `;
}

const EditorPage = () => {
  const { codeId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);

  const [tab, setTab] = useState("html");
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [jsCode, setJsCode] = useState("");
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoadingCode, setIsLoadingCode] = useState(codeId !== "new");

  const isNewCode = codeId === "new";

  useEffect(() => {
    if (!iframeRef.current) {
      return;
    }

    iframeRef.current.srcdoc = buildPreviewDocument(htmlCode, cssCode, jsCode);
  }, [htmlCode, cssCode, jsCode]);

  useEffect(() => {
    async function fetchCodeForEdit() {
      if (isNewCode) {
        setProjectTitle("Untitled Project");
        setHtmlCode("");
        setCssCode("");
        setJsCode("");
        setStatusMessage("");
        setIsLoadingCode(false);
        return;
      }

      try {
        setIsLoadingCode(true);

        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/fetch-code/${codeId}`,
          {},
          { withCredentials: true }
        );

        const savedCode = response.data.data;
        setHtmlCode(savedCode.html_code || "");
        setCssCode(savedCode.css_code || "");
        setJsCode(savedCode.js_code || "");
        setProjectTitle(savedCode.code_title || "Untitled Project");
        setStatusMessage("");
      } catch (error) {
        console.error("Unable to load code", error);
        setStatusMessage("Unable to load this project right now.");
      } finally {
        setIsLoadingCode(false);
      }
    }

    fetchCodeForEdit();
  }, [codeId, isNewCode]);

  async function downloadZip() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/download-zip`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ htmlCode, cssCode, jsCode }),
        }
      );

      const blob = await response.blob();
      const link = document.createElement("a");

      link.href = window.URL.createObjectURL(blob);
      link.download = `${projectTitle || "codefusion-project"}.zip`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Unable to download ZIP", error);
      setStatusMessage("Unable to download the project ZIP right now.");
    }
  }

  function handleChange(value, type) {
    if (type === "html") {
      setHtmlCode(value);
      return;
    }

    if (type === "css") {
      setCssCode(value);
      return;
    }

    setJsCode(value);
  }

  function handleDialogOpen() {
    setIsDialogOpen(true);
  }

  function handleDialogClose() {
    setIsDialogOpen(false);
  }

  async function handleDialogConfirm(title) {
    const endpoint = isNewCode
      ? `${import.meta.env.VITE_BACKEND_URL}/api/save-new-code`
      : `${import.meta.env.VITE_BACKEND_URL}/api/save/${codeId}`;

    try {
      const response = await axios.post(
        endpoint,
        {
          title,
          htmlCode,
          cssCode,
          javaScriptCode: jsCode,
        },
        {
          withCredentials: true,
        }
      );

      const savedCode = response.data.data;
      setProjectTitle(savedCode?.code_title || title);
      setStatusMessage(
        isNewCode ? "Project created successfully." : "Changes saved successfully."
      );
      setIsDialogOpen(false);

      if (isNewCode && savedCode?.code_id) {
        navigate(`/editor/${savedCode.code_id}`, { replace: true });
      }
    } catch (error) {
      console.error("Unable to save project", error);
      setStatusMessage("Unable to save this project right now.");
      setIsDialogOpen(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <EditorNavbar title={projectTitle} />

      <div className="flex">
        <div className={`${isExpanded ? "w-full" : "w-1/2"}`}>
          <div className="flex h-[56px] items-center justify-between gap-4 border-b border-white/10 bg-[#1A1919] px-6">
            <div className="flex items-center gap-2">
              {["html", "css", "js"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    tab === item
                      ? "bg-cyan-400 text-slate-950"
                      : "bg-[#1E1E1E] text-slate-300 hover:text-white"
                  }`}
                >
                  {item.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <BackButton />
              <button type="button" className="cursor-pointer" onClick={handleDialogOpen}>
                <FaSave />
              </button>
              <button type="button" className="cursor-pointer" onClick={downloadZip}>
                <RiFileDownloadLine />
              </button>
              <button
                type="button"
                className="text-[20px] cursor-pointer"
                onClick={() => setIsDarkTheme((currentTheme) => !currentTheme)}
              >
                <MdLightMode />
              </button>
              <button
                type="button"
                className="text-[20px] cursor-pointer"
                onClick={() => setIsExpanded((currentValue) => !currentValue)}
              >
                <AiOutlineExpandAlt />
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="border-b border-white/10 bg-cyan-400/10 px-6 py-3 text-sm text-cyan-100">
              {statusMessage}
            </div>
          )}

          {isDialogOpen && (
            <DialogBox
              text="save"
              initialValue={projectTitle === "Untitled Project" ? "" : projectTitle}
              onClose={handleDialogClose}
              onConfirm={handleDialogConfirm}
            />
          )}

          {isLoadingCode ? (
            <div className="flex h-[82vh] items-center justify-center text-slate-300">
              Loading project...
            </div>
          ) : (
            <>
              {tab === "html" && (
                <Editor
                  onChange={(value) => handleChange(value || "", "html")}
                  height="82vh"
                  theme={isDarkTheme ? "vs-dark" : "vs"}
                  language="html"
                  value={htmlCode}
                />
              )}
              {tab === "css" && (
                <Editor
                  onChange={(value) => handleChange(value || "", "css")}
                  height="82vh"
                  theme={isDarkTheme ? "vs-dark" : "vs"}
                  language="css"
                  value={cssCode}
                />
              )}
              {tab === "js" && (
                <Editor
                  onChange={(value) => handleChange(value || "", "js")}
                  height="82vh"
                  theme={isDarkTheme ? "vs-dark" : "vs"}
                  language="javascript"
                  value={jsCode}
                />
              )}
            </>
          )}
        </div>

        <iframe
          ref={iframeRef}
          title="CodeFusion preview"
          sandbox="allow-scripts"
          className={`min-h-[calc(100vh-80px)] ${isExpanded ? "hidden" : "w-1/2"} bg-white`}
        />
      </div>
    </div>
  );
};

export default EditorPage;
