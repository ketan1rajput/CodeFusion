const User = require("../../models/User");

async function requireAdmin(req, res, next) {
  if (!req.user?.id) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }

  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "isAdmin"],
    });

    if (!user?.isAdmin) {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    req.user.isAdmin = true;
    return next();
  } catch (error) {
    console.error("Unable to verify admin access", error);
    return res.status(500).json({ success: false, message: "Unable to verify admin access." });
  }
}

module.exports = { requireAdmin };
