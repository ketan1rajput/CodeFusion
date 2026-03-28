const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  if (!process.env.SECRET_KEY) {
    return res.status(500).json({
      success: false,
      message: "Server authentication is not configured correctly.",
    });
  }

  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied" });
  }

  try {
    const verified = jwt.verify(token, process.env.SECRET_KEY);
    req.user = verified;
    return next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid token" });
  }
}

module.exports = { authenticateToken };
