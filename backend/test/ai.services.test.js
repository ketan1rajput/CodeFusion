const test = require("node:test");
const assert = require("node:assert/strict");

process.env.OPENROUTER_API_KEY =
  process.env.OPENROUTER_API_KEY || "test-key";

const {
  generateFrontendCodeResponse,
  parseFrontendCodeResponse,
} = require("../src/services/ai.services");

test("parseFrontendCodeResponse accepts an object-like hint with null code", () => {
  const response = `{
    explanation: "Start by replacing the empty div with a semantic nav element.",
    code: null,
  }`;

  assert.deepEqual(parseFrontendCodeResponse(response, "explain"), {
    explanation:
      "Start by replacing the empty div with a semantic nav element.",
    code: null,
  });
});

test("parseFrontendCodeResponse preserves valid JSON code responses", () => {
  const response = JSON.stringify({
    explanation: "Updated the markup.",
    code: "<nav>Links</nav>",
  });

  assert.deepEqual(parseFrontendCodeResponse(response, "fix"), {
    explanation: "Updated the markup.",
    code: "<nav>Links</nav>",
  });
});

test("parseFrontendCodeResponse accepts file objects from code actions", () => {
  const response = JSON.stringify({
    explanation: "Fixed the click handler.",
    code: {
      html: '<button id="save">Save</button>',
      css: "button { color: blue; }",
      js: 'document.querySelector("#save").textContent = "Saved";',
    },
  });

  assert.deepEqual(
    JSON.parse(parseFrontendCodeResponse(response, "debug").code),
    {
      html: '<button id="save">Save</button>',
      css: "button { color: blue; }",
      js: 'document.querySelector("#save").textContent = "Saved";',
    }
  );
});

test("parseFrontendCodeResponse extracts fenced JSON after short preamble text", () => {
  const response = `Here is the result:\n\n\`\`\`json\n${JSON.stringify({
    explanation: "Reduced repeated DOM lookups.",
    code: JSON.stringify({
      html: '<main id="app"></main>',
      css: "#app { display: grid; }",
      js: 'const app = document.querySelector("#app");',
    }),
  })}\n\`\`\``;

  const result = parseFrontendCodeResponse(response, "optimize");
  assert.equal(result.explanation, "Reduced repeated DOM lookups.");
  assert.deepEqual(JSON.parse(result.code), {
    html: '<main id="app"></main>',
    css: "#app { display: grid; }",
    js: 'const app = document.querySelector("#app");',
  });
});

test("parseFrontendCodeResponse allows omitted code for explanation actions", () => {
  assert.deepEqual(
    parseFrontendCodeResponse('{"explanation":"Break the task into two steps."}', "hint"),
    { explanation: "Break the task into two steps.", code: null }
  );
});

test("parseFrontendCodeResponse rejects null code for code-generating actions", () => {
  assert.throws(
    () =>
      parseFrontendCodeResponse(
        '{"explanation":"Here is a solution.","code":null}',
        "debug"
      ),
    /invalid structured response/
  );
});

test("generateFrontendCodeResponse retries once when the response is malformed", async () => {
  let calls = 0;
  let retryPrompt = "";
  const aiClient = {
    chat: {
      completions: {
        create: async ({ messages }) => {
          calls += 1;
          if (calls === 2) {
            retryPrompt = messages[1].content;
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      explanation: "Fixed the selector.",
                      code: {
                        html: '<button id="run">Run</button>',
                        css: "",
                        js: 'document.querySelector("#run");',
                      },
                    }),
                  },
                },
              ],
            };
          }

          return { choices: [{ message: { content: "not valid JSON" } }] };
        },
      },
    },
  };

  const result = await generateFrontendCodeResponse(
    { action: "debug", language: "javascript", code: "Current code" },
    aiClient
  );

  assert.equal(calls, 2);
  assert.match(retryPrompt, /Retry: Your previous response could not be parsed/);
  assert.deepEqual(JSON.parse(result.code), {
    html: '<button id="run">Run</button>',
    css: "",
    js: 'document.querySelector("#run");',
  });
});

test("generateFrontendCodeResponse does not retry provider errors", async () => {
  let calls = 0;
  const aiClient = {
    chat: {
      completions: {
        create: async () => {
          calls += 1;
          throw new Error("Provider unavailable");
        },
      },
    },
  };

  await assert.rejects(
    generateFrontendCodeResponse(
      { action: "optimize", language: "javascript", code: "Current code" },
      aiClient
    ),
    /Provider unavailable/
  );
  assert.equal(calls, 1);
});
