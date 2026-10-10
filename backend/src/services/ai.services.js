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

const generateFrontendCodeResponse = async ({ action, language, code }) => {
    const actionInstructions = {
        suggest: "Suggest improvements to the supplied frontend code and provide the improved code.",
        optimize: "Improve the supplied frontend code for readability, performance, and maintainability.",
        fix: "Identify bugs in the supplied frontend code, explain the fixes, and provide corrected code.",
        explain: "Explain what the supplied frontend code does. Set code to null because no replacement code is needed.",
        solve: "Treat the supplied text as a frontend coding problem and provide a suitable solution.",
    };

    const response = await client.chat.completions.create({
        model: "openrouter/free",
        messages: [
            {
                role: "system",
                content: [
                    "You are a coding assistant focused only on frontend development.",
                    "Only write HTML, CSS, and JavaScript frontend code. Do not write backend, server, or database code.",
                    `The requested language is ${language}.`,
                    actionInstructions[action],
                    "Return only a valid JSON object with exactly these fields: explanation (string) and code (string or null).",
                    "Use complete replacement code in code when the action calls for code; use null only when no replacement code is appropriate.",
                ].join(" "),
            },
            {
                role: "user",
                content: code,
            },
        ],
    });

    const content = response.choices[0].message.content;

    if (typeof content !== "string") {
        throw new Error("AI returned an invalid structured response");
    }

    const jsonContent = content
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");

    let result;

    try {
        result = JSON.parse(jsonContent);
    } catch {
        throw new Error("AI returned an invalid structured response");
    }

    if (
        !result ||
        typeof result.explanation !== "string" ||
        (action === "explain"
            ? !(typeof result.code === "string" || result.code === null)
            : typeof result.code !== "string")
    ) {
        throw new Error("AI returned an invalid structured response");
    }

    return {
        explanation: result.explanation,
        code: result.code,
    };
};

module.exports = {
    generateAIResponse,
    generateFrontendCodeResponse,
};