const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;
const bcrypt = require("bcrypt");

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
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch || !existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "No user found!" });
    }

    const token = jwt.sign(
      {
        id: existingUser.id,
        username: existingUser.username,
      },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    await User.update({ isLoggedIn: true }, { where: { username, password } });

    req.user = existingUser;
    req.token = token;

    next(); // Call next() to pass control to the next middleware
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Export properly
module.exports = { loginMiddleware };
