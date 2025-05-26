const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const router = express.Router();
const cors = require("cors");
const archiver = require("archiver");

const loginMiddleware =
  require("../middlewares/loginMiddleware").loginMiddleware;
const authenticateToken =
  require("../middlewares/authenticateToken").authenticateToken;

const { signUp, login } = require("../controllers/LoginController");
const {
  loginSchema,
  signUpSchema,
  codeSaveSchema,
  detailsSchema,
} = require("../validators/validator");

const {
  saveCode,
  showAllCode,
  fetchCode,
  saveNewCode,
  deleteCode,
  searchCode,
} = require("../controllers/CodeController");

app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3000;
const allowedOrigins = process.env.CORS_ORIGIN.split(",");

app.use(
  cors({
    origin: allowedOrigins,
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
router.post("/sign-up", (req, res) => {
  const { error } = signUpSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((err) => err.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  signUp(req.body, res);
});

// Show all codes
router.post("/all-codes/:id", async (req, res) => {
  const { error } = detailsSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((err) => err.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  const { username, userId } = req.body;
  const showAllDetails = await showAllCode(username, userId);
  if (showAllDetails) {
    res.status(200).send({ data: showAllDetails, success: true });
  } else {
    res.status(400).send({ success: false, message: "Code not saved !" });
  }
});

// Save new code
router.post("/save-new-code", (req, res) => {
  const { error } = codeSaveSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const messages = error.details.map((err) => err.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  let saveCodeData = saveNewCode(req.body);
  if (saveCodeData) {
    res.status(200).send({ success: true, message: saveCodeData });
  } else {
    res.status(400).send({ success: false, message: "Code not saved !" });
  }
});

// Save existing code
router.post("/save/:id", (req, res) => {
  let saveCodeData = saveCode(req.body);
  if (saveCodeData) {
    res.status(200).send({ success: true, message: saveCodeData });
  } else {
    res.status(400).send({ success: false, message: "Code is not saved" });
  }
});

// Fetch a particular code
router.post("/fetch-code/:id", async (req, res) => {
  const fetchCodeData = await fetchCode(req.params.id);
  res
    .status(200)
    .json({ message: "Fetched successfully", data: fetchCodeData });
});

// Delete code
router.post("/delete/:id", async (req, res) => {
  const deleteCodeData = await deleteCode(req.params.id);
  if (deleteCodeData) {
    res.status(200).json({ message: "Deleted successfully" });
  }
});

// Search code
router.get("/search", async (req, res) => {
  const { title, username } = req.query;
  if (title) {
    searchCode(title, username, res);
  }
  console.log("this is title", title);
});

// ✅ ZIP download route using router (correct way!)
router.post("/download-zip", async (req, res) => {
  const { htmlCode, cssCode, jsCode } = req.body;

  const archive = archiver("zip", { zlib: { level: 9 } });
  res.attachment("codify.zip");
  archive.pipe(res);

  archive.append(htmlCode, { name: "index.html" });
  archive.append(cssCode, { name: "style.css" });
  archive.append(jsCode, { name: "script.js" });

  archive.finalize();

  archive.on("error", (err) => {
    res.status(500).send({ error: err.message });
  });

  archive.on("end", () => {
    console.log("Archive finalized and sent!");
  });
});

// Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
  });
  res.status(200).json({ message: "log out successfully" });
});

// ✅ Apply authenticateToken after login/signup routes
app.use(authenticateToken);

// ✅ Mount the router finally
app.use("/api", router);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
