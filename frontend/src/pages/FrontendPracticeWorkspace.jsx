import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Editor from "@monaco-editor/react";

const FILE_TABS = [
  { key: "html", label: "index.html", language: "html" },
  { key: "css", label: "style.css", language: "css" },
  { key: "js", label: "script.js", language: "javascript" },
];

const AI_ACTIONS = [
  {
    key: "hint",
    label: "Get Hint",
    action: "hint",
    prompt:
      "Give only one concise conceptual hint that helps the learner make progress. Do not reveal the solution, write code, or give the complete steps.",
    includeCurrentCode: true,
    showCode: false,
  },
  {
    key: "explain-problem",
    label: "Explain Problem",
    action: "explainProblem",
    prompt:
      "Explain the problem requirements in clear, simple terms. Do not provide a solution or code.",
    includeCurrentCode: false,
    showCode: false,
  },
  {
    key: "debug",
    label: "Debug My Code",
    action: "debug",
    prompt:
      "Find bugs in the learner's current frontend code, explain what is wrong, and provide corrected code. Use every acceptance test case as a required pass condition.",
    includeCurrentCode: true,
    showCode: true,
  },
  {
    key: "optimize",
    label: "Optimize My Code",
    action: "optimize",
    prompt:
      "Improve the learner's current frontend code for readability, performance, and maintainability without breaking behavior. Explain the changes and provide the improved code. The solution must continue to satisfy every acceptance test case.",
    includeCurrentCode: true,
    showCode: true,
  },
  {
    key: "explain-code",
    label: "Explain Code",
    action: "explainCode",
    prompt:
      "Explain how the learner's current frontend code works, section by section. Do not replace it with a different solution.",
    includeCurrentCode: true,
    showCode: false,
  },
];

function parseAICodeFiles(code) {
  const normalizedCode = code
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    const files = JSON.parse(normalizedCode);
    if (
      files &&
      typeof files.html === "string" &&
      typeof files.css === "string" &&
      typeof files.js === "string"
    ) {
      return files;
    }
  } catch {
    // Also accept labeled file code blocks from models that wrap the JSON incorrectly.
  }

  const files = {};
  const fileBlockPattern = /```(html|css|javascript|js)\s*\n([\s\S]*?)```/gi;
  let match;

  while ((match = fileBlockPattern.exec(code)) !== null) {
    const file = match[1].toLowerCase();
    files[file === "javascript" || file === "js" ? "js" : file] =
      match[2].replace(/\s+$/, "");
  }

  return typeof files.html === "string" &&
    typeof files.css === "string" &&
    typeof files.js === "string"
    ? files
    : null;
}

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
  const aiRequestControllerRef = useRef(null);
  const completedQuestionIdRef = useRef(null);
  const completionRequestQuestionIdRef = useRef(null);

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFile, setActiveFile] = useState("html");
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [js, setJs] = useState("");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [isQuestionCelebrating, setIsQuestionCelebrating] = useState(false);
  const [completionSaveFailed, setCompletionSaveFailed] = useState(false);
  const [completionNeedsLogin, setCompletionNeedsLogin] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [activeAIAction, setActiveAIAction] = useState(null);
  const [isAIRequesting, setIsAIRequesting] = useState(false);
  const [aiResult, setAIResult] = useState(null);
  const [aiError, setAIError] = useState("");

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
    aiRequestControllerRef.current?.abort();
    completedQuestionIdRef.current = null;
    completionRequestQuestionIdRef.current = null;
    setIsQuestionCelebrating(false);
    setIsTimerPaused(false);
    setCompletionSaveFailed(false);
    setCompletionNeedsLogin(false);
    setIsAIAssistantOpen(false);
    setActiveAIAction(null);
    setIsAIRequesting(false);
    setAIResult(null);
    setAIError("");

    return () => aiRequestControllerRef.current?.abort();
  }, [id]);

  useEffect(() => {
    if (!question || isTimerPaused) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setRemainingSeconds((currentSeconds) =>
        currentSeconds > 0 ? currentSeconds - 1 : 0
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, [question, isTimerPaused]);

  useEffect(() => {
    if (!previewRef.current) {
      return;
    }

    previewRef.current.srcdoc = buildPreviewDocument(html, css, js);
  }, [html, css, js]);

  function buildAIQuestionContext(action) {
    const questionDetails = [
      `Title: ${question.title}`,
      `Description: ${question.description || "No description provided."}`,
      `Requirements:\n${
        question.requirements?.length
          ? question.requirements.map((requirement) => `- ${requirement}`).join("\n")
          : "No additional requirements."
      }`,
    ].join("\n\n");

    const currentCode = [
      `HTML:\n${html || "(empty)"}`,
      `CSS:\n${css || "(empty)"}`,
      `JavaScript:\n${js || "(empty)"}`,
    ].join("\n\n");

    const includeTests = action.key === "debug" || action.key === "optimize";

    return [
      "You are helping with an HTML, CSS, and JavaScript coding exercise.",
      action.showCode
        ? "When returning code, set code to a JSON string with exactly three string properties: html, css, and js."
        : "Do not include replacement code unless the request explicitly asks for it.",
      `User request: ${action.prompt}`,
      `Selected question:\n${questionDetails}`,
      includeTests && question.testCases?.length
        ? `Acceptance tests:\n${JSON.stringify(question.testCases)}`
        : "",
      action.includeCurrentCode ? `Learner's current code:\n${currentCode}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  async function requestAIResponse(action, signal) {
    const language =
      FILE_TABS.find((file) => file.key === activeFile)?.language || "html";
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/ai/code`,
      {
        action: action.action,
        language,
        code: buildAIQuestionContext(action),
      },
      { withCredentials: true, signal }
    );
    const result = response.data?.result;
    if (
      !response.data?.success ||
      !result ||
      typeof result.explanation !== "string"
    ) {
      throw new Error("The AI returned an unexpected response.");
    }

    if (action.showCode) {
      if (typeof result.code !== "string") {
        throw new Error("The AI did not return separate HTML, CSS, and JavaScript files.");
      }

      const codeFiles = parseAICodeFiles(result.code);
      if (!codeFiles) {
        throw new Error("The AI response could not be separated into HTML, CSS, and JavaScript files. Please try again.");
      }

      return { ...result, codeFiles };
    }

    return result;
  }

  async function handleAIAction(action) {
    aiRequestControllerRef.current?.abort();
    const controller = new AbortController();
    aiRequestControllerRef.current = controller;
    setActiveAIAction(action);
    setAIResult(null);
    setAIError("");
    setIsAIRequesting(true);

    try {
      const result = await requestAIResponse(action, controller.signal);
      setAIResult(result);
    } catch (requestError) {
      if (!axios.isCancel(requestError)) {
        setAIError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to get an AI response right now."
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsAIRequesting(false);
      }
    }
  }

  function closeAIAssistant() {
    aiRequestControllerRef.current?.abort();
    setIsAIAssistantOpen(false);
    setIsAIRequesting(false);
  }

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

  async function loadPreviewAndWait(code) {
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
      iframe.srcdoc = buildPreviewDocument(
        code.html,
        code.css,
        code.js,
        `${Date.now()}`
      );
    });

    await new Promise((resolve) => {
      window.setTimeout(resolve, 80);
    });
  }

  async function runTestSuite(code) {
    try {
      if (!question?.testCases?.length) {
        return {
          results: [
            {
              label: "No test cases available",
              passed: false,
              details: "This question does not have predefined tests yet.",
            },
          ],
        };
      }

      await loadPreviewAndWait(code);

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

      return { results: nextResults };
    } catch (err) {
      return {
        results: [
          {
            label: "Test runner error",
            passed: false,
            details: err.message || "Unable to run tests.",
          },
        ],
        error: err.message || "Unable to run tests.",
      };
    } finally {
      if (previewRef.current) {
        previewRef.current.srcdoc = buildPreviewDocument(html, css, js);
      }
    }
  }

  async function handleRunTests() {
    setIsQuestionCelebrating(false);
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
      const testRun = await runTestSuite({ html, css, js });
      setTestResults(testRun.results);
      const allTestsPassed =
        !testRun.error &&
        testRun.results.length > 0 &&
        testRun.results.every((result) => result.passed);

      if (allTestsPassed) {
        setIsQuestionCelebrating(true);
        setIsTimerPaused(true);
        setStatusMessage("All tests passed! Saving your progress...");

        if (completedQuestionIdRef.current === id) {
          setStatusMessage("All tests passed! Your progress is on the dashboard.");
        } else if (completionRequestQuestionIdRef.current !== id) {
          saveQuestionCompletion();
        }
      } else if (testRun.error) {
        setStatusMessage("Unable to run tests right now.");
      } else {
        const passedCount = testRun.results.filter(
          (result) => result.passed
        ).length;
        setStatusMessage(
          `${passedCount}/${testRun.results.length} tests passed.`
        );
      }
    } finally {
      setIsRunningTests(false);
    }
  }

  async function saveQuestionCompletion() {
    if (completionRequestQuestionIdRef.current === id) {
      return;
    }

    completionRequestQuestionIdRef.current = id;
    setCompletionSaveFailed(false);
    setCompletionNeedsLogin(false);
    setStatusMessage("Saving your progress...");

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/frontend-questions/${id}/completions`,
        {},
        { withCredentials: true }
      );
      completedQuestionIdRef.current = id;
      setStatusMessage("All tests passed! Your progress is on the dashboard.");
    } catch (requestError) {
      const needsLogin = [401, 403].includes(requestError.response?.status);
      const failureReason =
        requestError.response?.data?.details ||
        requestError.response?.data?.message ||
        requestError.message;
      setCompletionNeedsLogin(needsLogin);
      setCompletionSaveFailed(true);
      setStatusMessage(
        needsLogin
          ? "Tests passed, but your session has expired. Sign in to save your progress."
          : failureReason
            ? `Tests passed, but progress could not be saved: ${failureReason}`
            : "Tests passed, but progress could not be saved. Try saving again."
      );
    } finally {
      if (completionRequestQuestionIdRef.current === id) {
        completionRequestQuestionIdRef.current = null;
      }
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
    <div className="practice-workspace-page bg-[#06101f] px-3 py-3 text-white sm:px-4 lg:px-6">
      <div className="practice-workspace-grid mx-auto w-full max-w-[1800px] min-w-0 gap-4">
        <aside className="practice-question-panel min-w-0 rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur sm:p-6">
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

        <section className="practice-editor-panel min-w-0 overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1120]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                File
              </span>
              <div className="relative">
                <select
                  value={activeFile}
                  onChange={(e) => setActiveFile(e.target.value)}
                  className="appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2 pr-10 text-sm text-white transition hover:border-cyan-300/30 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                >
                  {FILE_TABS.map((file) => (
                    <option key={file.key} value={file.key} className="bg-[#141414]">
                      {file.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex h-2 w-2 items-center justify-center">
                  <div className="h-0 w-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-400" />
                </div>
              </div>
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
              <button
                type="button"
                onClick={() => {
                  setIsAIAssistantOpen(true);
                  setAIResult(null);
                  setAIError("");
                  setActiveAIAction(null);
                }}
                className="rounded-full border border-violet-300/30 bg-violet-400/10 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:border-violet-300/60 hover:bg-violet-400/20"
              >
                AI Assistant
              </button>
            </div>
          </div>

          <div className="practice-editor-content">
            <Editor
              height="100%"
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
          </div>
        </section>

        <aside className="practice-info-panel flex min-w-0 flex-col gap-4">
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

          {isQuestionCelebrating && (
            <section
              role="status"
              aria-live="polite"
              className="rounded-[28px] border border-emerald-300/25 bg-[linear-gradient(145deg,rgba(16,185,129,0.16),rgba(8,17,32,0.92))] p-5 shadow-lg shadow-emerald-950/10"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200/20 bg-emerald-300/10 text-2xl">
                🎉
              </div>
              <h2 className="text-lg font-semibold text-emerald-50">
                Hurray! All tests passed!
              </h2>
              <p className="mt-2 text-sm leading-6 text-emerald-100/75">
                {statusMessage || "You completed this challenge."}
              </p>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="mt-4 rounded-xl border border-emerald-200/25 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-300/20"
              >
                View your dashboard
              </button>
              {completionSaveFailed && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {completionNeedsLogin && (
                    <a
                      href="/"
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-emerald-200/25 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-300/10"
                    >
                      Sign in to save
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={saveQuestionCompletion}
                    className="rounded-xl border border-emerald-200/25 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-300/10"
                  >
                    Retry save
                  </button>
                </div>
              )}
            </section>
          )}

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

      {isAIAssistantOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeAIAssistant();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-assistant-title"
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0b1120] shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <h2 id="ai-assistant-title" className="text-xl font-semibold text-white">
                  AI Assistant
                </h2>
                <p className="mt-1 text-sm text-slate-400">{question.title}</p>
              </div>
              <button
                type="button"
                onClick={closeAIAssistant}
                aria-label="Close AI assistant"
                className="rounded-full border border-white/10 px-3 py-1 text-slate-300 transition hover:border-white/30 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 border-b border-white/10 p-4 sm:grid-cols-3">
              {AI_ACTIONS.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => handleAIAction(action)}
                  disabled={isAIRequesting}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    activeAIAction?.key === action.key
                      ? "border-violet-300/50 bg-violet-400/20 text-white"
                      : "border-white/10 bg-white/5 text-slate-200 hover:border-violet-300/30 hover:bg-violet-400/10"
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>

            <div className="min-h-48 overflow-y-auto p-6">
              {!activeAIAction && !aiError && (
                <p className="text-sm leading-6 text-slate-400">
                  Choose an action to get help with this frontend challenge.
                  Hints provide guidance without displaying solution code.
                </p>
              )}

              {isAIRequesting && (
                <p role="status" className="text-sm text-violet-200">
                  {activeAIAction?.key === "debug"
                    ? "Analyzing your code..."
                    : activeAIAction?.key === "optimize"
                      ? "Optimizing your code..."
                      : activeAIAction?.key === "hint"
                        ? "Generating hint..."
                        : activeAIAction?.key === "explain-problem"
                          ? "Explaining the problem..."
                          : "Explaining your code..."}
                </p>
              )}

              {aiError && (
                <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                  {aiError}
                </p>
              )}

              {aiResult && activeAIAction && (
                <div className="space-y-5">
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {activeAIAction.label}
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
                      {aiResult.explanation}
                    </p>
                  </div>
                  {activeAIAction.showCode && aiResult.codeFiles && (
                    <div className="space-y-3">
                      {[
                        ["html", "index.html"],
                        ["css", "style.css"],
                        ["js", "script.js"],
                      ].map(([file, label]) => (
                        <div key={file}>
                          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                            {label}
                          </h3>
                          <pre className="max-h-64 overflow-auto rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-cyan-50">
                            <code>{aiResult.codeFiles[file]}</code>
                          </pre>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setHtml(aiResult.codeFiles.html);
                          setCss(aiResult.codeFiles.css);
                          setJs(aiResult.codeFiles.js);
                        }}
                        className="rounded-full bg-violet-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-violet-300"
                      >
                        Use these files in the editor
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

    </div>
  );
};

export default FrontendPracticeWorkspace;
