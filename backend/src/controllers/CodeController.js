const { Op } = require("sequelize");
const { Code, User } = require("../../models/Assosiations");
const FrontendQuestion = require("../../models/FrontendQuestion");
const FrontendPracticeSolution = require("../../models/FrontendPracticeSolution");

const DIFFICULTY_TIME_LIMITS = {
  easy: 15,
  medium: 30,
  hard: 45,
};

const DEFAULT_STARTER_CODE = {
  html: "<div id=\"app\"></div>",
  css: "body {\n  font-family: sans-serif;\n  padding: 16px;\n}",
  js: "// Write your solution here",
};

function getTimeLimitMinutes(difficulty = "easy") {
  return DIFFICULTY_TIME_LIMITS[difficulty] || DIFFICULTY_TIME_LIMITS.easy;
}

function buildQuestionTags(question) {
  const text = `${question.title || ""} ${question.description || ""}`.toLowerCase();
  const tags = [];

  if (question.starter_html?.trim()) {
    tags.push("HTML");
  }

  if (question.starter_css?.trim()) {
    tags.push("CSS");
  }

  if (question.starter_js?.trim()) {
    tags.push("JavaScript");
  }

  const keywordTags = [
    { pattern: /\bclick|event|onclick\b/, tag: "Events" },
    { pattern: /\bdom|element|selector\b/, tag: "DOM" },
    { pattern: /\bbutton\b/, tag: "Buttons" },
    { pattern: /\bflex|center|layout|align\b/, tag: "Layout" },
    { pattern: /\bmodal|dialog|popup\b/, tag: "Components" },
    { pattern: /\bdark mode|theme|toggle\b/, tag: "State" },
    { pattern: /\bform|input|validation\b/, tag: "Forms" },
  ];

  keywordTags.forEach(({ pattern, tag }) => {
    if (pattern.test(text)) {
      tags.push(tag);
    }
  });

  if (tags.length === 0) {
    tags.push("Frontend");
  }

  return [...new Set(tags)].slice(0, 5);
}

function formatExpectedValue(value) {
  if (typeof value === "string") {
    return `"${value}"`;
  }

  return `${value}`;
}

function buildQuestionRequirements(question) {
  if (!Array.isArray(question.test_cases) || question.test_cases.length === 0) {
    return ["Build the solution described in the prompt."];
  }

  const requirements = question.test_cases.reduce((items, testCase) => {
    if (testCase.mustExist && testCase.selector) {
      items.push(`Ensure ${testCase.selector} exists in the DOM.`);
      return items;
    }

    if (
      testCase.action === "click" &&
      testCase.selector &&
      testCase.property &&
      typeof testCase.expected !== "undefined"
    ) {
      items.push(
        `After clicking ${testCase.selector}, ${testCase.property} should become ${formatExpectedValue(
          testCase.expected
        )}.`
      );
      return items;
    }

    if (
      testCase.selector &&
      testCase.property &&
      typeof testCase.expected !== "undefined"
    ) {
      items.push(
        `${testCase.selector} ${testCase.property} should be ${formatExpectedValue(
          testCase.expected
        )}.`
      );
    }

    return items;
  }, []);

  return requirements.length > 0
    ? requirements
    : ["Build the solution described in the prompt."];
}

function buildStarterCode(question) {
  return {
    html: question.starter_html || DEFAULT_STARTER_CODE.html,
    css: question.starter_css || DEFAULT_STARTER_CODE.css,
    js: question.starter_js || DEFAULT_STARTER_CODE.js,
  };
}

function serializeFrontendQuestion(question, options = {}) {
  const includeDetail = options.includeDetail || false;
  const starterCode = buildStarterCode(question);

  const serializedQuestion = {
    id: question.id,
    title: question.title,
    difficulty: question.difficulty,
    tags: buildQuestionTags(question),
    timeLimitMinutes: getTimeLimitMinutes(question.difficulty),
  };

  if (includeDetail) {
    serializedQuestion.description = question.description;
    serializedQuestion.requirements = buildQuestionRequirements(question);
    serializedQuestion.starterCode = starterCode;
    serializedQuestion.testCases = Array.isArray(question.test_cases)
      ? question.test_cases
      : [];
    serializedQuestion.files = [
      { name: "index.html", language: "html", content: starterCode.html },
      { name: "style.css", language: "css", content: starterCode.css },
      { name: "script.js", language: "javascript", content: starterCode.js },
    ];
  }

  return serializedQuestion;
}

function serializeSavedCode(code) {
  if (!code) {
    return null;
  }

  return {
    code_id: code.code_id,
    code_title: code.code_title,
    user_id: code.user_id,
    html_code: code.html_code,
    css_code: code.css_code,
    js_code: code.js_code,
    createdAt: code.createdAt,
    updatedAt: code.updatedAt,
  };
}

async function saveCode(codeDetails) {
  const { title, htmlCode, cssCode, javaScriptCode, userId, codeId } =
    codeDetails;

  const existingCode = await Code.findOne({
    where: {
      code_id: codeId,
      user_id: userId,
    },
  });

  if (!existingCode) {
    return null;
  }

  await existingCode.update({
    code_title: title,
    html_code: htmlCode,
    css_code: cssCode,
    js_code: javaScriptCode,
  });

  return serializeSavedCode(existingCode);
}

async function saveNewCode(codeDetails) {
  const { htmlCode, cssCode, javaScriptCode, title, userId } = codeDetails;

  const createdCode = await Code.create({
    user_id: userId,
    code_title: title,
    html_code: htmlCode,
    css_code: cssCode,
    js_code: javaScriptCode,
  });

  return serializeSavedCode(createdCode);
}

async function showAllCode(userId) {
  const userData = await User.findByPk(userId, {
    attributes: ["username"],
  });

  const allCodeFiles = await Code.findAll({
    where: {
      user_id: userId,
    },
    order: [["updatedAt", "DESC"]],
  });

  return {
    username: userData?.username || "",
    codes: allCodeFiles.map((code) => serializeSavedCode(code)),
  };
}

async function deleteCode(id, userId) {
  const savedCode = await Code.findOne({
    where: {
      code_id: id,
      user_id: userId,
    },
  });

  if (!savedCode) {
    return false;
  }

  await savedCode.destroy();
  return true;
}

async function searchCode(title, userId) {
  const codeDetails = await Code.findAll({
    where: {
      user_id: userId,
      code_title: {
        [Op.iLike]: `%${title}%`,
      },
    },
    order: [["updatedAt", "DESC"]],
  });

  return codeDetails.map((code) => serializeSavedCode(code));
}

async function getFrontendQuestion(id) {
  const question = await FrontendQuestion.findByPk(id, {
    attributes: [
      "id",
      "title",
      "description",
      "starter_html",
      "starter_css",
      "starter_js",
      "test_cases",
      "difficulty",
    ],
  });

  if (!question) {
    return null;
  }

  return serializeFrontendQuestion(question, { includeDetail: true });
}

async function listFrontendQuestions() {
  const questions = await FrontendQuestion.findAll({
    attributes: [
      "id",
      "title",
      "description",
      "starter_html",
      "starter_css",
      "starter_js",
      "test_cases",
      "difficulty",
      "created_at",
    ],
    order: [["created_at", "DESC"]],
  });

  return questions.map((question) => serializeFrontendQuestion(question));
}

async function saveFrontendSolution(solutionDetails) {
  const { questionId, userId, htmlCode, cssCode, jsCode } = solutionDetails;

  return FrontendPracticeSolution.create({
    questionId,
    userId,
    htmlCode,
    cssCode,
    jsCode,
  });
}

async function fetchCode(id, userId) {
  const codeData = await Code.findOne({
    where: {
      code_id: id,
      user_id: userId,
    },
  });

  return serializeSavedCode(codeData);
}

module.exports = {
  saveCode,
  showAllCode,
  fetchCode,
  saveNewCode,
  deleteCode,
  searchCode,
  getFrontendQuestion,
  listFrontendQuestions,
  saveFrontendSolution,
};
