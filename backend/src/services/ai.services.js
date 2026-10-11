const OpenAI = require("openai");

const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});

const generateAIResponse = async (prompt) => {
    const response = await client.chat.completions.create({
        model: "openrouter/free",
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
    });

    return response.choices[0].message.content;
};

function getJSONObjectCandidates(content) {
    const candidates = [
        content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, ""),
    ];

    for (let start = 0; start < content.length; start += 1) {
        if (content[start] !== "{") {
            continue;
        }

        let depth = 0;
        let inString = false;
        let escaped = false;

        for (let end = start; end < content.length; end += 1) {
            const character = content[end];

            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (character === "\\") {
                    escaped = true;
                } else if (character === '"') {
                    inString = false;
                }
                continue;
            }

            if (character === '"') {
                inString = true;
            } else if (character === "{") {
                depth += 1;
            } else if (character === "}") {
                depth -= 1;
                if (depth === 0) {
                    candidates.push(content.slice(start, end + 1));
                    start = end;
                    break;
                }
            }
        }
    }

    return [...new Set(candidates)];
}

function parseJSONObject(content) {
    for (const candidate of getJSONObjectCandidates(content)) {
        try {
            return JSON.parse(candidate);
        } catch {
            const repairedCandidate = candidate
                .replace(/([{,]\s*)(explanation|code)\s*:/g, '$1"$2":')
                .replace(/,\s*([}\]])/g, "$1");

            try {
                return JSON.parse(repairedCandidate);
            } catch {
                // Try the next complete object in the model response.
            }
        }
    }

    const error = new Error("AI returned an invalid structured response");
    error.code = "AI_INVALID_STRUCTURED_RESPONSE";
    throw error;
}

const parseFrontendCodeResponse = (content, action) => {
    if (typeof content !== "string") {
        const error = new Error("AI returned an invalid structured response");
        error.code = "AI_INVALID_STRUCTURED_RESPONSE";
        throw error;
    }

    const result = parseJSONObject(content);
    if (!result || typeof result !== "object" || Array.isArray(result)) {
        const error = new Error("AI returned an invalid structured response");
        error.code = "AI_INVALID_STRUCTURED_RESPONSE";
        throw error;
    }
    const explanation = result.explanation || result.explanationText;
    const isExplanationAction = [
        "explain",
        "explainCode",
        "explainProblem",
        "hint",
    ].includes(action);
    let code = result.code;

    if (typeof code === "undefined" && typeof result.html === "string") {
        code = {
            html: result.html,
            css: result.css || "",
            js: result.js || "",
        };
    }

    if (code && typeof code === "object" && !Array.isArray(code)) {
        code = JSON.stringify(code);
    }

    if (isExplanationAction && typeof code === "undefined") {
        code = null;
    }

    if (
        typeof explanation !== "string" ||
        (isExplanationAction
            ? !(typeof code === "string" || code === null)
            : typeof code !== "string")
    ) {
        const error = new Error("AI returned an invalid structured response");
        error.code = "AI_INVALID_STRUCTURED_RESPONSE";
        throw error;
    }

    return { explanation, code };
};

const generateFrontendCodeResponse = async (
    { action, language, code },
    aiClient = client
) => {
    const actionInstructions = {
        suggest: "Suggest improvements to the supplied frontend code and provide the improved code.",
        optimize: "Improve the supplied frontend code for readability, performance, and maintainability.",
        fix: "Identify bugs in the supplied frontend code, explain the fixes, and provide corrected code.",
        debug: "Find bugs in the supplied frontend code, explain them, and provide corrected code.",
        explain: "Explain what the supplied frontend code does. Set code to null because no replacement code is needed.",
        explainCode: "Explain what the supplied HTML, CSS, and JavaScript do in simple terms. Do not provide replacement code. Set code to null.",
        explainProblem: "Explain what the coding question asks and clarify its requirements. Do not solve it or provide code. Set code to null.",
        hint: "Give one useful, concise hint that helps the learner make progress. Never provide the complete solution or code. Set code to null.",
    };

    const systemMessage = {
        role: "system",
        content: [
            "You are a coding assistant focused only on frontend development.",
            "Only write HTML, CSS, and JavaScript frontend code. Do not write backend, server, or database code.",
            `The requested language is ${language}.`,
            actionInstructions[action],
            "For a hint, explain problem, or explain code request, keep the response concise and do not claim the user's code is correct or tested.",
            "Return only a valid JSON object with exactly these fields: explanation (string) and code (string or null).",
            "For code actions, code may be either a JSON string containing html, css, and js fields or an object with those fields.",
            "Use double-quoted property names and string values. Do not return a JavaScript object literal or trailing commas.",
            "Use complete replacement code in code when the action calls for code; use null only when no replacement code is appropriate.",
        ].join(" "),
    };

    for (let attempt = 0; attempt < 2; attempt += 1) {
        const retryInstruction = attempt === 0
            ? ""
            : "\n\nRetry: Your previous response could not be parsed. Return only a valid JSON object with exactly an explanation string and a code field. For code actions, code must contain the complete HTML, CSS, and JavaScript files.";
        const response = await aiClient.chat.completions.create({
            model: "openrouter/free",
            messages: [
                systemMessage,
                { role: "user", content: `${code}${retryInstruction}` },
            ],
        });

        try {
            return parseFrontendCodeResponse(
                response?.choices?.[0]?.message?.content,
                action
            );
        } catch (error) {
            if (attempt === 0 && error.code === "AI_INVALID_STRUCTURED_RESPONSE") {
                continue;
            }
            throw error;
        }
    }

    throw new Error("AI code request failed");
};

module.exports = {
    generateAIResponse,
    generateFrontendCodeResponse,
    parseFrontendCodeResponse,
};
