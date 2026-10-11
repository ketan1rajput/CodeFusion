// backend/src/routes/questions.js
const express = require("express");
const router = express.Router();
const {
  getFrontendQuestion,
  listFrontendQuestions,
  saveFrontendSolution,
  markFrontendQuestionComplete,
  getFrontendPracticeProgress,
} = require("../controllers/CodeController");
const { authenticateToken } = require("../middlewares/authenticateToken");

router.get("/", async (req, res) => {
  try {
    const questions = await listFrontendQuestions();

    res.status(200).json({
      message: "Questions fetched successfully",
      data: questions,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/progress", authenticateToken, async (req, res) => {
  try {
    const progress = await getFrontendPracticeProgress(req.user.id);
    return res.status(200).json({ success: true, data: progress });
  } catch (error) {
    console.error("Unable to load practice progress", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load practice progress.",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const question = await getFrontendQuestion(id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.status(200).json({
      message: "Question fetched successfully",
      data: question
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/solutions", authenticateToken, async (req, res) => {
  try {
    const questionId = req.params.id;
    const { htmlCode = "", cssCode = "", jsCode = "" } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const question = await getFrontendQuestion(questionId);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    const solution = await saveFrontendSolution({
      questionId,
      userId,
      htmlCode,
      cssCode,
      jsCode,
    });

    res.status(201).json({
      message: "Solution saved successfully",
      data: solution,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/completions", authenticateToken, async (req, res) => {
  try {
    const result = await markFrontendQuestionComplete(
      req.params.id,
      req.user.id
    );
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    return res.status(result.created ? 201 : 200).json({
      success: true,
      message: result.created
        ? "Question completion recorded."
        : "Question was already completed.",
      data: { questionId: result.completion.questionId },
    });
  } catch (error) {
    console.error("Unable to record practice completion", error);
    return res.status(500).json({
      success: false,
      message: "Unable to record practice completion.",
      ...(process.env.NODE_ENV !== "production"
        ? { details: error.message }
        : {}),
    });
  }
});

module.exports = router;
