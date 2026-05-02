const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const { requireAdmin } = require("../middlewares/requireAdmin");
const { showUsers, getQuestions, postQuestion, deleteQuestion, deleteUser, updateQuestion } = require("../controllers/AdminController");

router.get("/show-users", 
    authMiddleware,
    requireAdmin,
    showUsers
);

router.get("/get-questions",
  authMiddleware,
  requireAdmin,
  getQuestions
);

router.post("/post-question", 
    authMiddleware,
    requireAdmin,
    postQuestion
);

router.delete("/delete-question", async (req, res) => {
    await deleteQuestion();
  res.status(200).json({ message: "delete question success" });
});

router.delete("/delete-user", async (req, res) => {
    await deleteUser();
  res.status(200).json({ message: "delete user success" });
});

router.put("/update-question", async (req, res) => {
  await updateQuestion(req.body);
  res.status(200).json({ message: "update question success" });
});



module.exports = router;