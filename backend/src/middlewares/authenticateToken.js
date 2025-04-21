const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY || "";

function authenticateToken(req, res, next) {
  let excludedRoutes = [
    "/api/login",
    "/api/logout",
    "/api/sign-up",
    "/api/download-zip",
  ];
  if (excludedRoutes.includes(req.path)) {
    return next();
  }
  const token = req.cookies?.token;
  if (!token)
    return res.status(401).json({ success: false, message: "Access denied" });

  try {
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified; // Attach user payload to request
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: "Invalid token" });
  }
}

module.exports = { authenticateToken };
