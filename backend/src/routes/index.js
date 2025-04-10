const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const router = express.Router();
const cors = require("cors");
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
const PORT = process.env.PORT || 3000;

const allowedOrigins = process.env.CORS_ORIGIN.split(",");

app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use("/api", router);
app.use(authenticateToken);

//login route
router.post("/login", loginMiddleware, (req, res) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map((err) => err.message);
    return res.status(400).json({ success: false, error: messages });
  }

  res.cookie("token", req.token, {
    httpOnly: true,
    secure: "false",
    sameSite: "lax",
  });
  res.json({
    success: true,
    message: "Login successful",
    user: req.user,
    token: req.token,
  });
});

//sign up route
router.post("/sign-up", (req, res) => {
  const { error } = signUpSchema.validate(req.body, { abortEarly: false });
  let credentials = req.body;

  if (error) {
    const messages = error.details.map((err) => err.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  signUp(credentials, res);
});

//route to show all saved codes
router.post("/all-codes/:id", async (req, res) => {
  const { error } = detailsSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map((err) => err.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  const { username, userId } = req.body;
  const showAllDetails = await showAllCode(username, userId);
  if (showAllDetails) {
    res.status(200).send({
      data: showAllDetails,
      success: true,
    });
  } else {
    res.status(400).send({
      success: false,
      message: "Code not saved !",
    });
  }
});

router.post("/save-new-code", (req, res) => {
  let codeDetails = req.body;
  const { error } = codeSaveSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const messages = error.details.map((err) => err.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  let saveCodeData = saveNewCode(codeDetails);
  if (saveCodeData) {
    res.status(200).send({
      success: true,
      message: saveCodeData,
    });
  } else {
    res.status(400).send({
      success: false,
      message: "Code not saved !",
    });
  }
});

//route to save a code
router.post("/save/:id", (req, res) => {
  let codeDetails = req.body;
  let saveCodeData = saveCode(codeDetails);
  if (saveCodeData) {
    res.status(200).send({
      success: true,
      message: saveCodeData,
    });
  } else {
    res.status(400).send({
      success: false,
      message: "Code is not saved",
    });
  }
});

//route to fetch a particular code
router.post("/fetch-code/:id", async (req, res) => {
  const fetchCodeData = await fetchCode(req.params.id);
  console.log(fetchCodeData);
  res.status(200).json({
    message: "Fetched successfully",
    data: fetchCodeData,
  });
});

//route to delete a code
router.post("/delete/:id", async (req, res) => {
  const deleteCodeData = await deleteCode(req.params.id);
  if (deleteCodeData) {
    res.status(200).json({
      message: "Deleted successfully",
    });
  }
});

// route for search code based on title
router.get(`/search`, async (req, res) => {
  const { title, username } = req.query;
  if (title) {
    searchCode(title, username, res);
  }
  console.log("this is title", title);
});

//route for logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
  });
  res.status(200).json({ message: "log out successfully" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
