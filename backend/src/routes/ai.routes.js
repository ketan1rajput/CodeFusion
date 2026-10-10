const express = require("express");
const router = express.Router();
const {
    generateAIResponse,
    generateFrontendCodeResponse,
} = require("../services/ai.services");

const supportedActions = ["suggest", "optimize", "fix", "explain", "solve"];
const supportedLanguages = ["html", "css", "javascript"];

router.post("/generate", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({
                message: "Prompt is required",
            });
        }

        const result = await generateAIResponse(prompt);

        return res.status(200).json({
            success: true,
            result,
        });
    } catch (error) {
        console.error("AI Error:", error);

        return res.status(500).json({
            success: false,
            message: "AI request failed",
        });
    }
});

router.post("/code", async (req, res) => {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return res.status(400).json({
            success: false,
            message: "A valid request body is required",
        });
    }

    const { action, language, code } = body;

    if (!supportedActions.includes(action)) {
        return res.status(400).json({
            success: false,
            message: `Action must be one of: ${supportedActions.join(", ")}`,
        });
    }

    if (!supportedLanguages.includes(language)) {
        return res.status(400).json({
            success: false,
            message: `Language must be one of: ${supportedLanguages.join(", ")}`,
        });
    }

    if (typeof code !== "string" || !code.trim()) {
        return res.status(400).json({
            success: false,
            message: "Code is required",
        });
    }

    try {
        const result = await generateFrontendCodeResponse({
            action,
            language,
            code,
        });

        return res.status(200).json({
            success: true,
            result,
        });
    } catch (error) {
        console.error("AI code request failed:", error);

        return res.status(500).json({
            success: false,
            message: "AI code request failed",
        });
    }
});

module.exports = router;