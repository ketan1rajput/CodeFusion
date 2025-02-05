const express = require("express");
const app = express();
const router = express.Router();
const cors = require("cors");
const pool = require("../db_connect/connection")
const User = require("../../models/User")
const loginMiddleware = require("../middlewares/loginMiddleware").loginMiddleware;
const { signUp, login } = require("../controllers/LoginController")
const { saveCode, showAllCode, fetchCode } = require("../controllers/CodeController");
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
})

//route to show all saved codes
router.get("/all-codes", async (req, res) => {
    const showAllDetails = await showAllCode();
    if (showAllDetails) {
        res.status(200).send({
          data: showAllDetails,
          success: true,
        });
    } else {
        res.status(400).send({
            success: false,
            message: "Code not saved !"
        })
    }
})

//route to save a code
router.post("/save", (req, res) => {
    let code = req.body;
    let saveCodeData = saveCode(code)
    if (saveCodeData) {
        res.status(200).send({
            success: true,
            message: code
        })
    } else {
        res.status(400).send({
            success: false,
            message: "Code is not saved"
        })
    }
})

//route to fetch a particular code
router.post("/fetch-code", async (req, res) => {
  const fetchCodeData = await fetchCode(req.body.id);
   console.log(fetchCodeData); 
    res.status(200).json({
        message: "Fetched successfully",
        data: fetchCodeData
  })
});

//route to delete a code
router.delete("/delete/:id", (req, res) => {
  console.log(req.params.id); // Use req.params to get the dynamic id
  console.log("deleted code successfully");
  res.status(200).send("Deleted successfully");
});

//route for logout
router.post("/logout", (req, res) => {
    res.status(200).json({message: "log out successfully"})
})


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})