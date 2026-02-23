import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";

const CodeEditor = ({
  mode = "snippet",
  initialHtml = "",
  initialCss = "",
  initialJs = "",
  onSave,
  onSubmit
}) => {
  const [tab, setTab] = useState("html");
  const [htmlCode, setHtmlCode] = useState(initialHtml);
  const [cssCode, setCssCode] = useState(initialCss);
  const [jsCode, setJsCode] = useState(initialJs);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    run(htmlCode, cssCode, jsCode);
  }, [htmlCode, cssCode, jsCode]);

  const run = (html, css, js) => {
    const iframe = document.getElementById("iframe");
    if (!iframe) return;

    iframe.srcdoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>${js}<\/script>
      </body>
      </html>
    `;
  };

  return (
    <div className="flex">
      <div className={`left ${isExpanded ? "w-full" : "w-1/2"}`}>
        
        {/* Tabs */}
        <div className="flex gap-3 bg-[#1A1919] p-3">
          {["html", "css", "js"].map((item) => (
            <div
              key={item}
              onClick={() => setTab(item)}
              className={`cursor-pointer ${
                tab === item ? "text-blue-500" : ""
              }`}
            >
              {item.toUpperCase()}
            </div>
          ))}
        </div>

        {/* Editor */}
        {tab === "html" && (
          <Editor
            height="82vh"
            theme="vs-dark"
            language="html"
            value={htmlCode}
            onChange={(v) => setHtmlCode(v || "")}
          />
        )}
        {tab === "css" && (
          <Editor
            height="82vh"
            theme="vs-dark"
            language="css"
            value={cssCode}
            onChange={(v) => setCssCode(v || "")}
          />
        )}
        {tab === "js" && (
          <Editor
            height="82vh"
            theme="vs-dark"
            language="javascript"
            value={jsCode}
            onChange={(v) => setJsCode(v || "")}
          />
        )}

        {/* Mode-based Actions */}
        <div className="flex gap-4 p-4">
          {mode === "snippet" && (
            <button
              className="bg-blue-600 px-4 py-2 rounded"
              onClick={() => onSave(htmlCode, cssCode, jsCode)}
            >
              Save
            </button>
          )}

          {mode === "practice" && (
            <button
              className="bg-green-600 px-4 py-2 rounded"
              onClick={() => onSubmit(htmlCode, cssCode, jsCode)}
            >
              Submit
            </button>
          )}
        </div>
      </div>

      <iframe
        id="iframe"
        className={`${isExpanded ? "hidden" : "w-1/2"} bg-white`}
      />
    </div>
  );
};

export default CodeEditor;