const User = require("../../models/User");

async function loginMiddleware(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "username and password are required!"
      });
    }

    const existingUser = await User.findOne({ where: { username, password } });
    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "No user found!" }); 
    }

    await User.update({ isLoggedIn: true }, { where: { username, password } });

    req.user = existingUser;
    next(); // Call next() to pass control to the next middleware
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Export properly
module.exports = { loginMiddleware };
