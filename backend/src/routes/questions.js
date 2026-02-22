// backend/src/routes/questions.js
const express = require("express");
const router = express.Router();
const { getFrontendQuestion } = require("../controllers/CodeController");
const { authenticateToken } = require("../middlewares/authenticateToken");

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

module.exports = router;
