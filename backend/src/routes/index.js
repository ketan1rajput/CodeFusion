const express = require("express");
const app = express();
const router = express.Router();
const cors = require("cors");
const pool = require("../db_connect/connection");
const loginMiddleware =
  require("../middlewares/loginMiddleware").loginMiddleware;
const { signUp, login } = require("../controllers/LoginController");
const {
  saveCode,
  showAllCode,
  fetchCode,
  saveNewCode,
  deleteCode,
} = require("../controllers/CodeController");
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 3000;

app.use("/api", router);

//login route
router.post("/login", loginMiddleware, (req, res) => {
  console.log("Login route triggered"); // Add this line
  res.json({ success: true, message: "Login successful", user: req.user });
});

//sign up route
router.post("/sign-up", (req, res) => {
  let credentials = req.body;
  signUp(credentials);
  res.send("Sign up successfull");
});

//route to show all saved codes
router.post("/all-codes/:id", async (req, res) => {
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
  let userId = req?.params?.id;
  let saveCodeData = saveCode(codeDetails, userId);
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

//route for logout
router.post("/logout", (req, res) => {
  res.status(200).json({ message: "log out successfully" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
