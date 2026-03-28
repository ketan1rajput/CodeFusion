import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

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

const CodeEditor = ({
  mode = "snippet",
  initialHtml = "",
  initialCss = "",
  initialJs = "",
  onSave,
  onSubmit,
}) => {
  const iframeRef = useRef(null);
  const [tab, setTab] = useState("html");
  const [htmlCode, setHtmlCode] = useState(initialHtml);
  const [cssCode, setCssCode] = useState(initialCss);
  const [jsCode, setJsCode] = useState(initialJs);

  useEffect(() => {
    if (!iframeRef.current) {
      return;
    }

    iframeRef.current.srcdoc = buildPreviewDocument(htmlCode, cssCode, jsCode);
  }, [htmlCode, cssCode, jsCode]);

  return (
    <div className="flex">
      <div className="left w-1/2">
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
        ref={iframeRef}
        title="Code preview"
        sandbox="allow-scripts"
        className="w-1/2 bg-white"
      />
    </div>
  );
};

export default CodeEditor;
