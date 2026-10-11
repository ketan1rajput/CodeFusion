const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authenticateToken");
const { requireAdmin } = require("../middlewares/requireAdmin");
const {
  showUsers,
  getQuestions,
  postQuestion,
  deleteQuestion,
  deleteUser,
  updateQuestion,
} = require("../controllers/AdminController");

router.use(authenticateToken, requireAdmin);

router.get("/show-users", showUsers);
router.get("/get-questions", getQuestions);
router.post("/post-question", postQuestion);
router.put("/update-question", updateQuestion);
router.delete("/delete-question", deleteQuestion);
router.delete("/delete-user", deleteUser);

module.exports = router;
