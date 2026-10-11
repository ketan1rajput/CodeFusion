const User = require("../../models/User");
const Code = require("../../models/Code");
const FrontendQuestion = require("../../models/FrontendQuestion");
const FrontendPracticeSolution = require("../../models/FrontendPracticeSolution");
const FrontendPracticeCompletion = require("../../models/FrontendPracticeCompletion");
const sequelize = require("../db_connect/sequelize");

const QUESTION_DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const QUESTION_TEXT_FIELDS = [
  "title",
  "description",
  "starter_html",
  "starter_css",
  "starter_js",
];
const QUESTION_FIELDS = [...QUESTION_TEXT_FIELDS, "difficulty", "test_cases"];

function parseQuestionFields(body, { partial = false } = {}) {
  const fields = {};

  for (const field of QUESTION_TEXT_FIELDS) {
    if (!Object.hasOwn(body, field)) {
      if (!partial && ["title", "description"].includes(field)) {
        return { error: `${field} is required` };
      }
      continue;
    }

    if (typeof body[field] !== "string") {
      return { error: `${field} must be text` };
    }

    const value = body[field].trim();
    if (!partial && ["title", "description"].includes(field) && !value) {
      return { error: `${field} is required` };
    }
    fields[field] = value;
  }

  if (Object.hasOwn(body, "difficulty")) {
    if (!QUESTION_DIFFICULTIES.has(body.difficulty)) {
      return { error: "difficulty must be easy, medium, or hard" };
    }
    fields.difficulty = body.difficulty;
  } else if (!partial) {
    fields.difficulty = "easy";
  }

  if (Object.hasOwn(body, "test_cases")) {
    let testCases = body.test_cases;
    if (typeof testCases === "string") {
      try {
        testCases = JSON.parse(testCases);
      } catch {
        return { error: "test_cases must be valid JSON" };
      }
    }
    if (!Array.isArray(testCases)) {
      return { error: "test_cases must be an array" };
    }
    fields.test_cases = testCases;
  } else if (!partial) {
    fields.test_cases = [];
  }

  if (Object.keys(fields).length === 0) {
    return { error: "At least one question field is required" };
  }

  return { fields };
}

function parseUserId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isQuestionId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || "")
  );
}

function sendServerError(res, error, message) {
  console.error(message, error);
  return res.status(500).json({ success: false, message });
}

async function showUsers(req, res) {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "email", "isAdmin", "createdAt"],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    return sendServerError(res, error, "Unable to load users.");
  }
}

async function getQuestions(req, res) {
  try {
    const questions = await FrontendQuestion.findAll({
      order: [["created_at", "DESC"]],
    });
    return res.status(200).json({ success: true, data: questions });
  } catch (error) {
    return sendServerError(res, error, "Unable to load questions.");
  }
}

async function postQuestion(req, res) {
  const { fields, error } = parseQuestionFields(req.body || {});
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  try {
    const question = await FrontendQuestion.create(fields);
    return res.status(201).json({
      success: true,
      message: "Question created successfully.",
      data: question,
    });
  } catch (createError) {
    return sendServerError(res, createError, "Unable to create question.");
  }
}

async function deleteQuestion(req, res) {
  const id = req.body?.id;
  if (!isQuestionId(id)) {
    return res.status(400).json({ success: false, message: "A valid question id is required." });
  }

  try {
    const questionDeleted = await sequelize.transaction(async (transaction) => {
      const question = await FrontendQuestion.findByPk(id, { transaction });
      if (!question) return false;

      await FrontendPracticeSolution.destroy({
        where: { questionId: id },
        transaction,
      });
      await FrontendPracticeCompletion.destroy({
        where: { questionId: id },
        transaction,
      });
      await question.destroy({ transaction });
      return true;
    });

    if (!questionDeleted) {
      return res.status(404).json({ success: false, message: "Question not found." });
    }
    return res.status(200).json({ success: true, message: "Question deleted successfully." });
  } catch (error) {
    return sendServerError(res, error, "Unable to delete question.");
  }
}

async function deleteUser(req, res) {
  const id = parseUserId(req.body?.id);
  if (!id) {
    return res.status(400).json({ success: false, message: "A valid user id is required." });
  }
  if (id === Number(req.user.id)) {
    return res.status(400).json({ success: false, message: "You cannot delete your own account from the admin panel." });
  }

  try {
    const targetUser = await User.findByPk(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (targetUser.isAdmin) {
      const adminCount = await User.count({ where: { isAdmin: true } });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: "The last admin account cannot be deleted." });
      }
    }

    await sequelize.transaction(async (transaction) => {
      await Code.destroy({ where: { user_id: id }, transaction });
      await FrontendPracticeSolution.destroy({
        where: { userId: id },
        transaction,
      });
      await FrontendPracticeCompletion.destroy({
        where: { userId: id },
        transaction,
      });
      await targetUser.destroy({ transaction });
    });
    return res.status(200).json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    return sendServerError(res, error, "Unable to delete user.");
  }
}

async function updateQuestion(req, res) {
  const id = req.body?.id;
  if (!isQuestionId(id)) {
    return res.status(400).json({ success: false, message: "A valid question id is required." });
  }

  const payload = Object.fromEntries(
    Object.entries(req.body || {}).filter(([field]) => QUESTION_FIELDS.includes(field))
  );
  const { fields, error } = parseQuestionFields(payload, { partial: true });
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  try {
    const question = await FrontendQuestion.findByPk(id);
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found." });
    }
    await question.update(fields);
    return res.status(200).json({
      success: true,
      message: "Question updated successfully.",
      data: question,
    });
  } catch (error) {
    return sendServerError(res, error, "Unable to update question.");
  }
}

module.exports = {
  showUsers,
  getQuestions,
  postQuestion,
  deleteQuestion,
  deleteUser,
  updateQuestion,
};
