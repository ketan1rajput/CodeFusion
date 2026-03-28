import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Editor from "@monaco-editor/react";

const FILE_TABS = [
  { key: "html", label: "index.html", language: "html" },
  { key: "css", label: "style.css", language: "css" },
  { key: "js", label: "script.js", language: "javascript" },
];

const difficultyClasses = {
  easy: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  medium: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  hard: "border-rose-400/30 bg-rose-400/10 text-rose-100",
};

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function escapeClosingScriptTags(code = "") {
  return code.replace(/<\/script/gi, "<\\/script");
}

function buildPreviewDocument(html, css, js, nonce = "preview") {
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
        <script>
          window.__CF_RUNTIME_ERRORS = [];
          window.addEventListener("error", function (event) {
            window.__CF_RUNTIME_ERRORS.push(event.message || "Unknown runtime error");
          });
          window.addEventListener("unhandledrejection", function (event) {
            const reason = event.reason && event.reason.message
              ? event.reason.message
              : String(event.reason || "Unhandled promise rejection");
            window.__CF_RUNTIME_ERRORS.push(reason);
          });
        </script>
        <script>${escapeClosingScriptTags(js)}</script>
        <!-- ${nonce} -->
      </body>
    </html>
  `;
}

function describeTestCase(testCase, index) {
  if (testCase.description) {
    return testCase.description;
  }

  if (testCase.expression || testCase.output || testCase.jsExpression) {
    return `Test ${index + 1}: validate JavaScript output`;
  }

  if (testCase.mustExist && testCase.selector) {
    return `Test ${index + 1}: ${testCase.selector} should exist`;
  }

  if (testCase.mustNotExist && testCase.selector) {
    return `Test ${index + 1}: ${testCase.selector} should not exist`;
  }

  if (testCase.action && testCase.selector) {
    return `Test ${index + 1}: ${testCase.action} on ${testCase.selector}`;
  }

  if (testCase.selector && testCase.property) {
    return `Test ${index + 1}: ${testCase.selector}.${testCase.property}`;
  }

  return `Test ${index + 1}`;
}

function getValueAtPath(source, path) {
  if (!source || !path) {
    return source;
  }

  return path.split(".").reduce((currentValue, segment) => {
    if (currentValue == null) {
      return undefined;
    }

    if (segment === "length" && Array.isArray(currentValue)) {
      return currentValue.length;
    }

    return currentValue[segment];
  }, source);
}

function normalizeComparableValue(value, property) {
  if (typeof value === "string") {
    if (property === "textContent" || property === "innerText") {
      return value.trim().replace(/\s+/g, " ");
    }

    return value.trim();
  }

  return value;
}

function getObservedValue(element, testCase, previewWindow) {
  if (testCase.expression || testCase.output || testCase.jsExpression) {
    const expression =
      testCase.expression || testCase.output || testCase.jsExpression;
    return previewWindow.eval(expression);
  }

  if (!element) {
    return undefined;
  }

  if (testCase.attribute) {
    return element.getAttribute(testCase.attribute);
  }

  if (testCase.property) {
    return getValueAtPath(element, testCase.property);
  }

  if (typeof testCase.expected !== "undefined") {
    return element.textContent;
  }

  return element;
}

function compareValues(actual, expected, property) {
  if (Array.isArray(expected)) {
    return JSON.stringify(actual) === JSON.stringify(expected);
  }

  if (typeof expected === "string") {
    return normalizeComparableValue(actual, property) ===
      normalizeComparableValue(expected, property);
  }

  return actual === expected;
}

function formatResultValue(value) {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "undefined") {
    return "undefined";
  }

  return JSON.stringify(value);
}

function triggerAction(element, testCase, previewWindow) {
  if (!element || !testCase.action) {
    return;
  }

  const nextValue =
    typeof testCase.value !== "undefined"
      ? testCase.value
      : testCase.inputValue;

  switch (testCase.action) {
    case "click":
      element.dispatchEvent(
        new previewWindow.MouseEvent("click", { bubbles: true, cancelable: true })
      );
      break;
    case "input":
      if (typeof nextValue !== "undefined") {
        element.value = nextValue;
      }
      element.dispatchEvent(new previewWindow.Event("input", { bubbles: true }));
      break;
    case "change":
      if (typeof nextValue !== "undefined") {
        element.value = nextValue;
      }
      element.dispatchEvent(new previewWindow.Event("change", { bubbles: true }));
      break;
    case "submit":
      element.dispatchEvent(new previewWindow.Event("submit", { bubbles: true }));
      break;
    case "focus":
      element.focus();
      break;
    case "blur":
      element.blur();
      break;
    default:
      break;
  }
}

async function runSingleTestCase(testCase, index, previewWindow, previewDocument) {
  const label = describeTestCase(testCase, index);

  try {
    const selector = testCase.selector;
    const element = selector ? previewDocument.querySelector(selector) : null;

    if (testCase.mustExist) {
      return {
        label,
        passed: Boolean(element),
        details: element
          ? `${selector} exists`
          : `${selector} was not found`,
      };
    }

    if (testCase.mustNotExist) {
      return {
        label,
        passed: !element,
        details: element
          ? `${selector} exists but should not`
          : `${selector} is absent`,
      };
    }

    if (selector && !element) {
      return {
        label,
        passed: false,
        details: `${selector} was not found`,
      };
    }

    triggerAction(element, testCase, previewWindow);
    await new Promise((resolve) => {
      previewWindow.setTimeout(resolve, testCase.delay || 60);
    });

    if (typeof testCase.expected === "undefined") {
      return {
        label,
        passed: true,
        details: "Action completed",
      };
    }

    const actual = getObservedValue(element, testCase, previewWindow);
    const passed = compareValues(actual, testCase.expected, testCase.property);

    return {
      label,
      passed,
      details: passed
        ? `Expected ${formatResultValue(testCase.expected)} and received ${formatResultValue(actual)}`
        : `Expected ${formatResultValue(testCase.expected)} but received ${formatResultValue(actual)}`,
    };
  } catch (error) {
    return {
      label,
      passed: false,
      details: error.message || "Test execution failed.",
    };
  }
}

const FrontendPracticeWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const previewRef = useRef(null);

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFile, setActiveFile] = useState("html");
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    async function fetchQuestion() {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/frontend-questions/${id}`,
          { withCredentials: true }
        );

        const nextQuestion = response.data.data;
        setQuestion(nextQuestion);
        setHtml(nextQuestion.starterCode?.html || "");
        setCss(nextQuestion.starterCode?.css || "");
        setJs(nextQuestion.starterCode?.js || "");
        setRemainingSeconds((nextQuestion.timeLimitMinutes || 15) * 60);
        setActiveFile("html");
        setStatusMessage("");
      } catch {
        setError("Unable to load this question.");
      } finally {
        setLoading(false);
      }
    }

    fetchQuestion();
  }, [id]);

  useEffect(() => {
    if (!question) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((currentSeconds) =>
        currentSeconds > 0 ? currentSeconds - 1 : 0
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [question]);

  useEffect(() => {
    if (!previewRef.current) {
      return;
    }

    previewRef.current.srcdoc = buildPreviewDocument(html, css, js);
  }, [html, css, js]);

  async function handleSaveSolution() {
    try {
      setIsSaving(true);
      setStatusMessage("");

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/frontend-questions/${id}/solutions`,
        {
          htmlCode: html,
          cssCode: css,
          jsCode: js,
        },
        { withCredentials: true }
      );

      const savedAt = new Date(response.data.data.createdAt).toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      setStatusMessage(`Solution saved at ${savedAt}.`);
    } catch {
      setStatusMessage("Unable to save your solution right now.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    if (!question?.starterCode) {
      return;
    }

    setHtml(question.starterCode.html || "");
    setCss(question.starterCode.css || "");
    setJs(question.starterCode.js || "");
    setTestResults([]);
    setStatusMessage("Code reset to the starter template.");
  }

  async function loadPreviewAndWait() {
    const iframe = previewRef.current;

    if (!iframe) {
      throw new Error("Preview is not available.");
    }

    await new Promise((resolve, reject) => {
      const timeoutId = window.setTimeout(() => {
        iframe.removeEventListener("load", handleLoad);
        reject(new Error("Preview timed out while loading."));
      }, 3000);

      function handleLoad() {
        window.clearTimeout(timeoutId);
        resolve();
      }

      iframe.addEventListener("load", handleLoad, { once: true });
      iframe.srcdoc = buildPreviewDocument(html, css, js, `${Date.now()}`);
    });

    await new Promise((resolve) => {
      window.setTimeout(resolve, 80);
    });
  }

  async function handleRunTests() {
    if (!question?.testCases?.length) {
      setTestResults([
        {
          label: "No test cases available",
          passed: false,
          details: "This question does not have predefined tests yet.",
        },
      ]);
      return;
    }

    try {
      setIsRunningTests(true);
      setStatusMessage("Running tests...");
      await loadPreviewAndWait();

      const iframe = previewRef.current;
      const previewWindow = iframe?.contentWindow;
      const previewDocument = iframe?.contentDocument;

      if (!previewWindow || !previewDocument) {
        throw new Error("Preview is not ready.");
      }

      const runtimeErrors = Array.isArray(previewWindow.__CF_RUNTIME_ERRORS)
        ? previewWindow.__CF_RUNTIME_ERRORS
        : [];

      const nextResults = [];

      runtimeErrors.forEach((errorMessage, index) => {
        nextResults.push({
          label: `Runtime error ${index + 1}`,
          passed: false,
          details: errorMessage,
        });
      });

      for (let index = 0; index < question.testCases.length; index += 1) {
        const result = await runSingleTestCase(
          question.testCases[index],
          index,
          previewWindow,
          previewDocument
        );
        nextResults.push(result);
      }

      setTestResults(nextResults);

      const passedCount = nextResults.filter((result) => result.passed).length;
      setStatusMessage(
        `${passedCount}/${nextResults.length} tests passed.`
      );
    } catch (err) {
      setTestResults([
        {
          label: "Test runner error",
          passed: false,
          details: err.message || "Unable to run tests.",
        },
      ]);
      setStatusMessage("Unable to run tests right now.");
    } finally {
      setIsRunningTests(false);
    }
  }

  function getActiveCodeValue() {
    if (activeFile === "css") {
      return css;
    }

    if (activeFile === "js") {
      return js;
    }

    return html;
  }

  function updateActiveCode(nextValue) {
    if (activeFile === "css") {
      setCss(nextValue);
      return;
    }

    if (activeFile === "js") {
      setJs(nextValue);
      return;
    }

    setHtml(nextValue);
  }

  if (loading) {
    return <div className="p-10 text-white">Loading...</div>;
  }

  if (error || !question) {
    return <div className="p-10 text-white">{error || "Question not found"}</div>;
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#06101f] px-4 py-4 text-white lg:px-6">
      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_420px]">
        <aside className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
          <button
            type="button"
            onClick={() => navigate("/practice")}
            className="mb-6 rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
          >
            Back to questions
          </button>

          <div className="mb-4 flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold leading-tight text-slate-50">
              {question.title}
            </h1>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                difficultyClasses[question.difficulty] || difficultyClasses.easy
              }`}
            >
              {question.difficulty}
            </span>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {(question.tags || []).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-cyan-200/15 bg-cyan-200/10 px-3 py-1 text-xs text-cyan-50"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mb-6 rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Time Limit
            </div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {question.timeLimitMinutes} min
            </div>
          </div>

          <section className="mb-6">
            <h2 className="mb-3 text-sm uppercase tracking-[0.3em] text-slate-400">
              Description
            </h2>
            <p className="whitespace-pre-line text-sm leading-7 text-slate-300">
              {question.description}
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-sm uppercase tracking-[0.3em] text-slate-400">
              Requirements
            </h2>
            <div className="space-y-3">
              {(question.requirements || []).map((requirement, index) => (
                <div
                  key={`${question.id}-requirement-${index}`}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-200"
                >
                  {requirement}
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1120]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              {FILE_TABS.map((file) => (
                <button
                  key={file.key}
                  type="button"
                  onClick={() => setActiveFile(file.key)}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    activeFile === file.key
                      ? "bg-cyan-400 text-slate-950"
                      : "border border-white/10 bg-white/5 text-slate-300 hover:border-cyan-300/30 hover:text-white"
                  }`}
                >
                  {file.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleRunTests}
                disabled={isRunningTests}
                className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300/60 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRunningTests ? "Running..." : "Run Tests"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-amber-300/40 hover:text-white"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSaveSolution}
                disabled={isSaving}
                className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-700"
              >
                {isSaving ? "Saving..." : "Save Solution"}
              </button>
            </div>
          </div>

          <Editor
            height="78vh"
            language={
              FILE_TABS.find((file) => file.key === activeFile)?.language || "html"
            }
            theme="vs-dark"
            value={getActiveCodeValue()}
            onChange={(value) => updateActiveCode(value || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              automaticLayout: true,
            }}
          />
        </section>

        <aside className="flex flex-col gap-4">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div className="mb-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              Timer
            </div>
            <div className="text-5xl font-semibold text-white">
              {formatTime(remainingSeconds)}
            </div>
            <p className="mt-3 text-sm text-slate-300">
              The timer starts as soon as the workspace opens.
            </p>
            {statusMessage && (
              <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50">
                {statusMessage}
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Test Results
                </div>
                <div className="mt-1 text-sm text-slate-300">
                  {(question.testCases || []).length} predefined tests
                </div>
              </div>
              {testResults.length > 0 && (
                <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">
                  {testResults.filter((result) => result.passed).length}/{testResults.length} passed
                </div>
              )}
            </div>

            <div className="space-y-3">
              {testResults.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-5 text-sm text-slate-400">
                  Run tests to validate DOM behavior and JavaScript output.
                </div>
              )}

              {testResults.map((result, index) => (
                <div
                  key={`${result.label}-${index}`}
                  className={`rounded-2xl border px-4 py-4 text-sm ${
                    result.passed
                      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-50"
                      : "border-rose-300/20 bg-rose-400/10 text-rose-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{result.label}</div>
                    <div className="text-xs uppercase tracking-[0.2em]">
                      {result.passed ? "Pass" : "Fail"}
                    </div>
                  </div>
                  <div className="mt-2 text-xs leading-6 opacity-80">
                    {result.details}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white">
            <div className="border-b border-slate-200 px-5 py-4 text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Live Preview
            </div>
            <iframe
              ref={previewRef}
              title="Frontend Interview Preview"
              className="h-[640px] w-full bg-white"
            />
          </section>
        </aside>
      </div>
    </div>
  );
};

export default FrontendPracticeWorkspace;
