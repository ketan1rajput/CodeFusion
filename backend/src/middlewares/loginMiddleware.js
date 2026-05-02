const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const { buildCookieOptions, serializeUser } = require("../utils/auth");

async function loginMiddleware(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "username and password are required!",
      });
    }

    const existingUser = await User.findOne({ where: { username } });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "No user found!",
      });
    }

    if (!process.env.SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "Server authentication is not configured correctly.",
      });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password!",
      });
    }

    const token = jwt.sign(
      {
        id: existingUser.id,
        username: existingUser.username,
        isAdmin: existingUser.isAdmin
      },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );
    console.log("SIGN SECRET in login middleware ------:", process.env.SECRET_KEY);

    res.cookie("token", token, buildCookieOptions());

    await User.update({ isLoggedIn: true }, { where: { username } });

    req.user = serializeUser(existingUser);
    req.token = token;

    return next();
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { loginMiddleware };
