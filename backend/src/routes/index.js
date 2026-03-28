const archiver = require("archiver");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
require("dotenv").config();

const { signUp } = require("../controllers/LoginController");
const {
  deleteCode,
  fetchCode,
  saveCode,
  saveNewCode,
  searchCode,
  showAllCode,
} = require("../controllers/CodeController");
const {
  authenticateToken,
} = require("../middlewares/authenticateToken");
const { loginMiddleware } = require("../middlewares/loginMiddleware");
const { buildCookieOptions } = require("../utils/auth");
const {
  codeSaveSchema,
  loginSchema,
  signUpSchema,
} = require("../validators/validator");
const FrontendPracticeSolution = require("../../models/FrontendPracticeSolution");
const frontendQuestionRoutes = require("./questions");

const app = express();
const router = express.Router();

app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  })
);

// ✅ All routes go here

// Login route
router.post("/login", loginMiddleware, (req, res) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((err) => err.message);
    return res.status(400).json({ success: false, error: messages });
  }

  res.json({
    success: true,
    message: "Login successful",
    user: req.user,
    token: req.token,
  });
});

// Signup
router.post("/sign-up", async (req, res) => {
  const { error } = signUpSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((err) => err.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  return signUp(req.body, res);
});

router.post("/download-zip", async (req, res) => {
  const { htmlCode = "", cssCode = "", jsCode = "" } = req.body;

  try {
    const archive = archiver("zip", { zlib: { level: 9 } });

    res.attachment("codefusion-project.zip");
    archive.pipe(res);
    archive.append(htmlCode, { name: "index.html" });
    archive.append(cssCode, { name: "style.css" });
    archive.append(jsCode, { name: "script.js" });

    archive.on("error", (error) => {
      res.status(500).json({ success: false, message: error.message });
    });

    await archive.finalize();
  } catch (error) {
    console.error("Unable to create ZIP archive", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to create ZIP archive." });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    ...buildCookieOptions(),
    maxAge: undefined,
  });

  return res.status(200).json({ message: "Logged out successfully" });
});

router.use(authenticateToken);

router.get("/me", (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
});

// Show all codes
router.post("/all-codes/:id", async (req, res) => {
  try {
    if (Number(req.params.id) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own projects.",
      });
    }

    const showAllDetails = await showAllCode(req.user.id);

    return res.status(200).json({ success: true, data: showAllDetails });
  } catch (error) {
    console.error("Unable to fetch saved codes", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch saved codes." });
  }
});

// Save new code
router.post("/save-new-code", async (req, res) => {
  const { error } = codeSaveSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((err) => err.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  try {
    const savedCodeData = await saveNewCode({
      ...req.body,
      userId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Code saved successfully",
      data: savedCodeData,
    });
  } catch (saveError) {
    console.error("Unable to save new code", saveError);
    return res
      .status(500)
      .json({ success: false, message: "Code could not be saved." });
  }
});

// Save existing code
router.post("/save/:id", async (req, res) => {
  const { error } = codeSaveSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map((err) => err.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  try {
    const savedCodeData = await saveCode({
      ...req.body,
      userId: req.user.id,
      codeId: req.params.id,
    });

    if (!savedCodeData) {
      return res.status(404).json({
        success: false,
        message: "Code not found for this user.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Code updated successfully",
      data: savedCodeData,
    });
  } catch (saveError) {
    console.error("Unable to update code", saveError);
    return res
      .status(500)
      .json({ success: false, message: "Code could not be updated." });
  }
});

// Fetch a particular code
router.post("/fetch-code/:id", async (req, res) => {
  try {
    const fetchCodeData = await fetchCode(req.params.id, req.user.id);

    if (!fetchCodeData) {
      return res.status(404).json({
        success: false,
        message: "Code not found for this user.",
      });
    }

    return res
      .status(200)
      .json({ message: "Fetched successfully", data: fetchCodeData });
  } catch (error) {
    console.error("Unable to fetch code", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to fetch the code." });
  }
});

// Delete code
router.post("/delete/:id", async (req, res) => {
  try {
    const deleteCodeData = await deleteCode(req.params.id, req.user.id);

    if (!deleteCodeData) {
      return res.status(404).json({
        success: false,
        message: "Code not found for this user.",
      });
    }

    return res.status(200).json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Unable to delete code", error);
    return res
      .status(500)
      .json({ success: false, message: "Unable to delete the code." });
  }
});

// Search code
router.get("/search", async (req, res) => {
  const title = `${req.query.title || ""}`.trim();

  if (!title) {
    return res.status(400).json({
      success: false,
      message: "Search title is required.",
    });
  }

  try {
    const matchedCodes = await searchCode(title, req.user.id);

    return res.status(200).json({
      success: true,
      data: matchedCodes,
    });
  } catch (error) {
    console.error("Unable to search code", error);
    return res.status(500).json({
      success: false,
      message: "Unable to search saved code.",
    });
  }
});

app.use("/api/frontend-questions", frontendQuestionRoutes);

// ✅ ZIP download route using router

// Logout

// ✅ Apply authenticateToken after login/signup routes

// ✅ Mount the router finally
app.use("/api", router);

async function startServer() {
  try {
    await FrontendPracticeSolution.sync();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server", error);
    process.exit(1);
  }
}

startServer();
